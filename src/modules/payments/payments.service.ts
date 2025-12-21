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
    this.logger.log("📦 PAYPRO IPN RECEIVED");
    this.logger.debug(payload);

    if (!payload || typeof payload !== "object") return;

    if (!this.verifySignature(payload)) {
      this.logger.error("❌ Invalid PayPro signature");
      return;
    }

    const { ORDER_ID, ORDER_STATUS, IPN_TYPE_NAME, CUSTOMER_EMAIL } = payload;

    if (await this.paymentsRepo.exists(ORDER_ID)) {
      this.logger.warn(`🔁 Duplicate IPN ignored: ${ORDER_ID}`);
      return;
    }

    const isSuccessful =
      ORDER_STATUS === "Processed" && IPN_TYPE_NAME === "OrderCharged";

    if (!isSuccessful) {
      await this.savePayment(ORDER_ID, "ignored", CUSTOMER_EMAIL);
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
   * SIGNATURE VALIDATION (RAW BODY)
   * ===================================== */
  private verifySignature(payload: any): boolean {
    const validationKey = process.env.PAYPRO_VALIDATION_KEY;

    if (!validationKey) {
      this.logger.error("PAYPRO_VALIDATION_KEY not set");
      return false;
    }

    const { ORDER_ID, ORDER_STATUS, IPN_TYPE_NAME, CUSTOMER_EMAIL, SIGNATURE } =
      payload;

    if (
      !ORDER_ID ||
      !ORDER_STATUS ||
      !IPN_TYPE_NAME ||
      !CUSTOMER_EMAIL ||
      !SIGNATURE
    ) {
      this.logger.error("Missing fields for signature verification");
      return false;
    }

    const sourceString =
      ORDER_ID + ORDER_STATUS + IPN_TYPE_NAME + CUSTOMER_EMAIL + validationKey;

    const calculated = createHash("sha256").update(sourceString).digest("hex");

    if (calculated !== SIGNATURE) {
      this.logger.error("Signature mismatch", {
        sourceString,
        received: SIGNATURE,
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
