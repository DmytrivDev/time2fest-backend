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

    if (!payload || typeof payload !== "object") {
      return;
    }

    const orderId: string | undefined = payload.ORDER_ID;
    const email: string | undefined = payload.CUSTOMER_EMAIL;
    const orderStatus: string | undefined = payload.ORDER_STATUS;
    const ipnType: string | undefined = payload.IPN_TYPE_NAME;

    if (!orderId) {
      console.warn("⚠️ IPN without ORDER_ID");
      return;
    }

    // 🔁 Deduplication
    if (await this.paymentsRepo.exists(orderId)) {
      console.log("🔁 Duplicate IPN ignored:", orderId);
      return;
    }

    const isSuccessful =
      orderStatus === "Processed" &&
      ipnType === "OrderCharged";

    // ❌ Not a successful payment
    if (!isSuccessful) {
      await this.savePayment(orderId, "ignored", email);
      return;
    }

    // ❌ Missing email
    if (!email) {
      await this.savePayment(orderId, "error");
      return;
    }

    // ❌ User not found
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      await this.savePayment(orderId, "error", email);
      return;
    }

    // ✅ Success
    await this.usersService.setPremium(email);
    await this.savePayment(orderId, "paid", email);

    console.log("🎉 Premium activated for:", email);
  }

  /* =====================================
   * CHECKOUT (FRONTEND ENTRY)
   * ===================================== */
  async createPayProCheckout(user: any): Promise<{ url: string }> {
    if (!user?.email) {
      throw new Error("User email missing");
    }

    if (user.isPremium) {
      throw new Error("User already premium");
    }

    const orderId = this.generateOrderId(user.id);

    const url = this.buildPayProPurchaseLink({
      orderId,
      email: user.email,
    });

    return { url };
  }

  /* =====================================
   * HELPERS
   * ===================================== */
  private async savePayment(
    orderId: string,
    status: PaymentStatus,
    email?: string
  ): Promise<void> {
    await this.paymentsRepo.save({
      orderId,
      email,
      status,
    });
  }

  private generateOrderId(userId: number | string): string {
    return `PREMIUM-${userId}-${Date.now()}`;
  }

  /**
   * Формує PayPro checkout URL + коректні return/cancel
   * FRONTEND НІЧОГО НЕ ЗНАЄ ПРО PAYPRO
   */
  private buildPayProPurchaseLink(data: {
    orderId: string;
    email: string;
  }): string {
    const PAYPRO_CHECKOUT_BASE =
      "https://checkout.payproglobal.com/order"; // ⚠️ реальний домен PayPro

    const FRONT_SUCCESS_URL =
      "https://time2fest.com/profile/subscription/success";

    const FRONT_CANCEL_URL =
      "https://time2fest.com/profile/subscription/cancel";

    const params = new URLSearchParams({
      order_id: data.orderId,
      customer_email: data.email,
      return_url: FRONT_SUCCESS_URL,
      cancel_url: FRONT_CANCEL_URL,
    });

    return `${PAYPRO_CHECKOUT_BASE}?${params.toString()}`;
  }
}
