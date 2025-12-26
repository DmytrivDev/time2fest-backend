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
    const baseUrl = process.env.PAYPRO_PURCHASE_URL;
    if (!baseUrl) {
      throw new Error("PAYPRO_PURCHASE_URL is not configured");
    }

    const internalOrderId = `T2F-${Date.now()}-${userId}`;

    await this.paymentsRepo.createPending({
      internalOrderId,
      userId,
      email,
      lang: lang && lang !== "en" ? lang : "en",
    });

    const params = new URLSearchParams({
      internal_order_id: internalOrderId,
      user_id: String(userId),
      CUSTOMER_EMAIL: email,
    });

    return {
      url: `${baseUrl}&${params.toString()}`,
    };
  }

  /* =====================================================
   * PAYPRO IPN (WEBHOOK)
   * ===================================================== */
  async handlePayProIpn(payload: any): Promise<void> {
    if (!payload) return;

    if (!this.verifySignature(payload)) {
      this.logger.warn("Invalid PayPro signature");
      return;
    }

    const {
      ORDER_ID,
      ORDER_STATUS,
      CHECKOUT_QUERY_STRING,
      CUSTOMER_EMAIL,
      INVOICE_LINK,
    } = payload;

    if (!CHECKOUT_QUERY_STRING) {
      this.logger.warn("IPN without CHECKOUT_QUERY_STRING");
      return;
    }

    const params = new URLSearchParams(CHECKOUT_QUERY_STRING);
    const internalOrderId = params.get("internal_order_id");

    if (!internalOrderId) {
      this.logger.warn("IPN without internal_order_id");
      return;
    }

    const payment = await this.paymentsRepo.findByInternalOrderId(
      internalOrderId
    );

    if (!payment) {
      this.logger.warn(`Payment not found: ${internalOrderId}`);
      return;
    }

    // 🔒 already finalized
    if (payment.status === "paid") {
      this.logger.log(`🔁 IPN ignored (already paid): ${internalOrderId}`);
      return;
    }

    // ✅ SUCCESS (будь-який фінальний статус)
    if (ORDER_STATUS === "Processed" || ORDER_STATUS === "Completed") {
      await this.paymentsRepo.finalize({
        internalOrderId,
        status: "paid",
        orderId: ORDER_ID,
        email: CUSTOMER_EMAIL,
        invoiceLink: INVOICE_LINK,
      });

      await this.usersService.setPremiumById(payment.user_id);

      this.logger.log(
        `🎉 Premium activated for userId=${payment.user_id} (${ORDER_ID})`
      );
      return;
    }

    // ❌ FAILED
    if (ORDER_STATUS === "Declined" || ORDER_STATUS === "Failed") {
      await this.paymentsRepo.finalize({
        internalOrderId,
        status: "error",
        orderId: ORDER_ID,
        email: CUSTOMER_EMAIL,
        invoiceLink: INVOICE_LINK,
      });
      return;
    }

    // ℹ️ everything else
    this.logger.log(
      `ℹ️ IPN received (ignored): ${internalOrderId} (${ORDER_STATUS})`
    );
  }

  /* =====================================================
   * LANG FOR REDIRECT
   * ===================================================== */
  async getLangByInternalOrderId(internalOrderId?: string): Promise<string> {
    if (!internalOrderId) return "en";

    return (
      (await this.paymentsRepo.getLangByInternalOrderId(internalOrderId)) ||
      "en"
    );
  }

  /* =====================================================
   * SIGNATURE CHECK
   * ===================================================== */
  private verifySignature(payload: any): boolean {
    const validationKey = process.env.PAYPRO_VALIDATION_KEY;
    if (!validationKey) return false;

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

    const hash = createHash("sha256").update(sourceString).digest("hex");

    return hash === SIGNATURE;
  }
}
