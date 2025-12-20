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
    console.log('📦 FULL IPN PAYLOAD:', JSON.stringify(payload, null, 2));
    if (!payload || typeof payload !== "object") {
      return;
    }

    const status = payload.payment_status || payload.order_status;
    const email = payload.email || payload.customer_email || null;
    const orderId = payload.order_id || payload.invoice_id;

    if (!orderId) {
      return;
    }

    // 🔁 Deduplication
    if (await this.paymentsRepo.exists(orderId)) {
      return;
    }

    // ❌ Not a successful payment
    if (!this.isSuccessfulStatus(status)) {
      await this.savePayment(orderId, 'ignored', email);
      return;
    }

    // ❌ Missing email
    if (!email) {
      await this.savePayment(orderId, 'error');
      return;
    }

    // ❌ User not found
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      await this.savePayment(orderId, email, "error");
      return;
    }

    // ✅ Success
    await this.usersService.setPremium(email);
    await this.savePayment(orderId, 'paid', email);
  }

  /* =====================================
   * CHECKOUT (FRONTEND)
   * ===================================== */
  async createPayProCheckout(user: any): Promise<{ url: string }> {
    if (!user?.email) {
      throw new Error("User email missing");
    }

    if (user.isPremium) {
      throw new Error("User already premium");
    }

    const orderId = this.generateOrderId(user.id);

    // ⚠️ Тут твоя реальна логіка створення PayPro purchase link
    const url = this.buildPayProPurchaseLink({
      orderId,
      email: user.email,
    });

    return { url };
  }

  /* =====================================
   * HELPERS
   * ===================================== */
  private isSuccessfulStatus(status: string): boolean {
    return ["approved", "paid", "completed"].includes(status);
  }

  private async savePayment(
    orderId: string,
    status: PaymentStatus,
    email?: string
  ) {
    await this.paymentsRepo.save({
      orderId,
      email,
      status,
    });
  }

  private generateOrderId(userId: number | string): string {
    return `PREMIUM-${userId}-${Date.now()}`;
  }

  private buildPayProPurchaseLink(data: {
    orderId: string;
    email: string;
  }): string {
    /**
     * ⚠️ Тут приклад.
     * Ти або:
     * 1) викликаєш PayPro API
     * 2) або формуєш purchase link за їх схемою
     */
    const baseUrl = "https://paypro.example/checkout";

    const params = new URLSearchParams({
      order_id: data.orderId,
      email: data.email,
    });

    return `${baseUrl}?${params.toString()}`;
  }
}
