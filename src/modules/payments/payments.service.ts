import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "crypto";
import { UserService } from "../user/user.service";
import { PaymentsRepository } from "./payments.repository";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly usersService: UserService,
    private readonly paymentsRepo: PaymentsRepository
  ) {}

  /* =====================================================
   * CREATE PAYPRO CHECKOUT
   * ===================================================== */
  async createPayProCheckout(
    userId: number,
    email: string,
    lang?: string
  ): Promise<{ url: string }> {
    this.logger.log("=== CREATE PAYPRO CHECKOUT ===");
    this.logger.log({ userId, email, lang });

    const baseUrl = process.env.PAYPRO_PURCHASE_URL;
    this.logger.log(`PAYPRO_PURCHASE_URL = ${baseUrl}`);

    if (!baseUrl) {
      this.logger.error("PAYPRO_PURCHASE_URL is NOT configured");
      throw new Error("PAYPRO_PURCHASE_URL is not configured");
    }

    const internalOrderId = `T2F-${Date.now()}-${userId}`;
    this.logger.log(`Generated internalOrderId = ${internalOrderId}`);

    await this.paymentsRepo.createPending({
      internalOrderId,
      userId,
      email,
      lang: lang && lang !== "en" ? lang : "en",
    });

    this.logger.log("Pending payment inserted into DB");

    const params = new URLSearchParams({
      internal_order_id: internalOrderId,
      user_id: String(userId),
      CUSTOMER_EMAIL: email,
    });

    const checkoutUrl = `${baseUrl}&${params.toString()}`;
    this.logger.log(`Checkout URL = ${checkoutUrl}`);

    return { url: checkoutUrl };
  }

  /* =====================================================
   * PAYPRO IPN (WEBHOOK)
   * ===================================================== */
  async handlePayProIpn(payload: any): Promise<void> {
    this.logger.log("=== PAYPRO IPN RECEIVED ===");

    if (!payload) {
      this.logger.warn("IPN payload is EMPTY");
      return;
    }

    // 1. RAW PAYLOAD
    this.logger.log("IPN RAW PAYLOAD:");
    this.logger.log(JSON.stringify(payload, null, 2));

    // 2. SIGNATURE CHECK
    const signatureValid = this.verifySignature(payload);
    this.logger.log(`Signature valid = ${signatureValid}`);

    if (!signatureValid) {
      this.logger.warn("⚠️ Invalid PayPro SIGNATURE");
    }

    const {
      ORDER_ID,
      ORDER_STATUS,
      IPN_TYPE_NAME,
      CHECKOUT_QUERY_STRING,
      CUSTOMER_EMAIL,
      INVOICE_LINK,
      TEST_MODE,
      ORDER_TOTAL_AMOUNT,
    } = payload;

    this.logger.log("Parsed IPN fields:");
    this.logger.log({
      ORDER_ID,
      ORDER_STATUS,
      IPN_TYPE_NAME,
      TEST_MODE,
      ORDER_TOTAL_AMOUNT,
      CUSTOMER_EMAIL,
      INVOICE_LINK,
      CHECKOUT_QUERY_STRING,
    });

    // 3. CHECKOUT_QUERY_STRING
    if (!CHECKOUT_QUERY_STRING) {
      this.logger.warn("❌ CHECKOUT_QUERY_STRING is missing");
      return;
    }

    const params = new URLSearchParams(CHECKOUT_QUERY_STRING);
    const internalOrderId = params.get("internal_order_id");
    const userIdParam = params.get("user_id");

    this.logger.log("Parsed CHECKOUT_QUERY_STRING params:");
    this.logger.log({
      internalOrderId,
      userIdParam,
      allParams: Object.fromEntries(params.entries()),
    });

    if (!internalOrderId) {
      this.logger.warn("❌ internal_order_id NOT FOUND in query string");
      return;
    }

    // 4. FETCH PAYMENT FROM DB
    const payment = await this.paymentsRepo.findByInternalOrderId(
      internalOrderId
    );

    this.logger.log("Payment fetched from DB:");
    this.logger.log(payment);

    if (!payment) {
      this.logger.warn(`❌ Payment NOT FOUND: ${internalOrderId}`);
      return;
    }

    // 5. ALREADY PAID?
    if (payment.status === "paid") {
      this.logger.log(`🔁 Already PAID, skipping: ${internalOrderId}`);
      return;
    }

    // 6. SUCCESS CASE
    if (
      ORDER_STATUS === "Processed" &&
      IPN_TYPE_NAME === "OrderCharged" &&
      userIdParam
    ) {
      this.logger.log("✅ SUCCESS CONDITIONS MET");
      this.logger.log({
        ORDER_STATUS,
        IPN_TYPE_NAME,
        userIdParam,
      });

      await this.paymentsRepo.finalize({
        internalOrderId,
        status: "paid",
        orderId: ORDER_ID,
        email: CUSTOMER_EMAIL,
        invoiceLink: INVOICE_LINK,
      });

      this.logger.log("Payment marked as PAID in DB");

      await this.usersService.setPremiumById(Number(userIdParam));

      this.logger.log(
        `🎉 Premium ACTIVATED for userId=${userIdParam} (${ORDER_ID})`
      );
      return;
    }

    // 7. FAILED CASE
    if (ORDER_STATUS === "Declined" || ORDER_STATUS === "Failed") {
      this.logger.warn("❌ PAYMENT FAILED");
      this.logger.log({ ORDER_STATUS });

      await this.paymentsRepo.finalize({
        internalOrderId,
        status: "error",
        orderId: ORDER_ID,
        email: CUSTOMER_EMAIL,
        invoiceLink: INVOICE_LINK,
      });

      this.logger.log("Payment marked as ERROR");
      return;
    }

    // 8. EVERYTHING ELSE
    this.logger.warn("ℹ️ IPN IGNORED (non-final state)");
    this.logger.log({
      internalOrderId,
      ORDER_STATUS,
      IPN_TYPE_NAME,
    });
  }

  /* =====================================================
   * LANG FOR REDIRECT
   * ===================================================== */
  async getLangByInternalOrderId(internalOrderId?: string): Promise<string> {
    this.logger.log("=== GET LANG BY INTERNAL ORDER ID ===");
    this.logger.log({ internalOrderId });

    if (!internalOrderId) {
      this.logger.warn("No internalOrderId provided, fallback to 'en'");
      return "en";
    }

    const lang = await this.paymentsRepo.getLangByInternalOrderId(
      internalOrderId
    );

    this.logger.log("Lang fetched from DB:");
    this.logger.log({ internalOrderId, lang });

    if (!lang) {
      this.logger.warn(
        `Lang NOT FOUND for internalOrderId=${internalOrderId}`
      );
    }

    return lang || "en";
  }

  /* =====================================================
   * SIGNATURE CHECK
   * ===================================================== */
  private verifySignature(payload: any): boolean {
    const validationKey = process.env.PAYPRO_VALIDATION_KEY;

    if (!validationKey) {
      this.logger.error("PAYPRO_VALIDATION_KEY is NOT set");
      return false;
    }

    const {
      ORDER_ID,
      ORDER_STATUS,
      ORDER_TOTAL_AMOUNT,
      CUSTOMER_EMAIL,
      TEST_MODE,
      IPN_TYPE_NAME,
      SIGNATURE,
    } = payload;

    const sourceString =
      ORDER_ID +
      ORDER_STATUS +
      ORDER_TOTAL_AMOUNT +
      CUSTOMER_EMAIL +
      validationKey +
      TEST_MODE +
      IPN_TYPE_NAME;

    const calculatedHash = createHash("sha256")
      .update(sourceString)
      .digest("hex");

    this.logger.log("Signature debug:");
    this.logger.log({
      sourceString,
      calculatedHash,
      receivedSignature: SIGNATURE,
    });

    return calculatedHash === SIGNATURE;
  }
}
