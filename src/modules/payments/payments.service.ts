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
  async handlePayProIpn(
    payload: any,
    rawBody: string
  ): Promise<void> {
    this.logger.log("📦 PAYPRO IPN RECEIVED");
    this.logger.debug(payload);

    if (!payload || !rawBody) {
      this.logger.error("Missing payload or rawBody");
      return;
    }

    const {
      ORDER_ID,
      ORDER_STATUS,
      CUSTOMER_EMAIL,
      IPN_TYPE_NAME,
      SIGNATURE,
    } = payload;

    if (!ORDER_ID || !SIGNATURE) {
      this.logger.warn("IPN missing ORDER_ID or SIGNATURE");
      return;
    }

    // 🔐 SIGNATURE VALIDATION (REAL PAYPRO LOGIC)
    if (!this.verifySignature(rawBody, SIGNATURE)) {
      this.logger.error("❌ Invalid PayPro signature");
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
   * SIGNATURE VALIDATION (RAW BODY)
   * ===================================== */
  private verifySignature(rawBody: string, received: string): boolean {
    const validationKey = process.env.PAYPRO_VALIDATION_KEY;

    if (!validationKey) {
      this.logger.error("PAYPRO_VALIDATION_KEY not set");
      return false;
    }

    const calculated = createHash("sha256")
      .update(rawBody + validationKey)
      .digest("hex");

    if (calculated !== received) {
      this.logger.error("Signature mismatch", {
        received,
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
