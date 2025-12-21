import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "crypto";
import { UserService } from "../user/user.service";
import { PaymentsRepository } from "./payments.repository";

export type PaymentStatus = "paid" | "error" | "ignored";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly usersService: UserService,
    private readonly paymentsRepo: PaymentsRepository
  ) {}

  /* =====================================
   * PAYPRO IPN
   * ===================================== */
  async handlePayProIpn(payload: any): Promise<void> {
    this.logger.log("📦 FULL IPN PAYLOAD");
    this.logger.debug(payload);

    if (!payload || typeof payload !== "object") return;

    const {
      ORDER_ID,
      ORDER_STATUS,
      CUSTOMER_EMAIL,
      IPN_TYPE_NAME,
      SIGNATURE,
    } = payload;

    if (!ORDER_ID) {
      this.logger.warn("IPN without ORDER_ID");
      return;
    }

    // 🔐 SIGNATURE VALIDATION
    if (!this.verifySignature(payload)) {
      this.logger.error("❌ IPN signature verification failed");
      return;
    }

    // 🔁 Deduplication
    if (await this.paymentsRepo.exists(ORDER_ID)) {
      this.logger.warn(`🔁 Duplicate IPN ignored: ${ORDER_ID}`);
      return;
    }

    const isSuccessful =
      ORDER_STATUS === "Processed" &&
      IPN_TYPE_NAME === "OrderCharged";

    if (!isSuccessful) {
      await this.savePayment(ORDER_ID, "ignored", CUSTOMER_EMAIL);
      return;
    }

    if (!CUSTOMER_EMAIL) {
      await this.savePayment(ORDER_ID, "error");
      return;
    }

    const user = await this.usersService.findByEmail(CUSTOMER_EMAIL);
    if (!user) {
      await this.savePayment(ORDER_ID, "error", CUSTOMER_EMAIL);
      return;
    }

    await this.usersService.setPremium(CUSTOMER_EMAIL);
    await this.savePayment(ORDER_ID, "paid", CUSTOMER_EMAIL);

    this.logger.log(`🎉 Premium activated for ${CUSTOMER_EMAIL}`);
  }

  /* =====================================
   * SIGNATURE VALIDATION
   * ===================================== */
  private verifySignature(payload: any): boolean {
    const validationKey = process.env.PAYPRO_VALIDATION_KEY;

    if (!validationKey) {
      this.logger.error("PAYPRO_VALIDATION_KEY is not configured");
      return false;
    }

    const rawString =
      payload.ORDER_ID +
      payload.ORDER_STATUS +
      payload.CUSTOMER_EMAIL +
      validationKey;

    const calculated = createHash("sha256")
      .update(rawString)
      .digest("hex");

    if (calculated !== payload.SIGNATURE) {
      this.logger.error("❌ Invalid PayPro IPN signature", {
        received: payload.SIGNATURE,
        calculated,
      });
      return false;
    }

    return true;
  }

  /* =====================================
   * CHECKOUT
   * ===================================== */
  async createPayProCheckout(): Promise<{ url: string }> {
    const url = process.env.PAYPRO_PURCHASE_URL;

    if (!url) {
      throw new Error("PAYPRO_PURCHASE_URL is not configured");
    }

    return { url };
  }

  /* =====================================
   * HELPERS
   * ===================================== */
  private async savePayment(
    orderId: string,
    status: PaymentStatus,
    email?: string
  ) {
    await this.paymentsRepo.save({ orderId, email, status });
  }
}
