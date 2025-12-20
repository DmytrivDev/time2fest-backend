import { Injectable } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { PaymentsRepository } from "./payments.repository";

export type PaymentStatus = "paid" | "error" | "ignored";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly usersService: UserService,
    private readonly paymentsRepo: PaymentsRepository
  ) {}

  /* =====================================
   * PAYPRO IPN
   * ===================================== */
  async handlePayProIpn(payload: any): Promise<void> {
    console.log("📦 FULL IPN PAYLOAD:", JSON.stringify(payload, null, 2));

    if (!payload || typeof payload !== "object") return;

    const orderId = payload.ORDER_ID;
    const email = payload.CUSTOMER_EMAIL;
    const orderStatus = payload.ORDER_STATUS;
    const ipnType = payload.IPN_TYPE_NAME;

    if (!orderId) return;

    if (await this.paymentsRepo.exists(orderId)) return;

    const isSuccessful =
      orderStatus === "Processed" && ipnType === "OrderCharged";

    if (!isSuccessful) {
      await this.savePayment(orderId, "ignored", email);
      return;
    }

    if (!email) {
      await this.savePayment(orderId, "error");
      return;
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      await this.savePayment(orderId, "error", email);
      return;
    }

    await this.usersService.setPremium(email);
    await this.savePayment(orderId, "paid", email);

    console.log("🎉 Premium activated for:", email);
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
