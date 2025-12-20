import { Injectable } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { PaymentsRepository } from "./payments.repository";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly usersService: UserService,
    private readonly paymentsRepo: PaymentsRepository
  ) {}

  async handlePayProIpn(payload: any) {
    if (!payload || typeof payload !== "object") {
      console.warn("⚠️ Empty or invalid IPN payload");
      return;
    }

    const status = payload.payment_status || payload.order_status;

    const email = payload.email || payload.customer_email;

    const orderId = payload.order_id || payload.invoice_id;

    console.log("🔎 Status:", status);
    console.log("🔎 Email:", email);
    console.log("🔎 Order ID:", orderId);

    if (!orderId) {
      console.error("❌ IPN without order_id");
      return;
    }

    // 🔁 ДЕДУПЛІКАЦІЯ
    if (await this.paymentsRepo.exists(orderId)) {
      console.log("🔁 Duplicate IPN ignored:", orderId);
      return;
    }

    // ❌ ПЛАТІЖ НЕ ЗАВЕРШЕНИЙ
    if (!["approved", "paid", "completed"].includes(status)) {
      await this.paymentsRepo.save({
        orderId,
        email,
        status: "ignored",
      });
      return;
    }

    if (!email) {
      console.warn("⚠️ No email in IPN");
      await this.paymentsRepo.save({
        orderId,
        status: "error",
      });
      return;
    }

    // ❌ ЮЗЕР НЕ ІСНУЄ → ПОМИЛКА
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      console.error("❌ User not found for IPN email:", email);

      await this.paymentsRepo.save({
        orderId,
        email,
        status: "error",
      });

      return;
    }

    // ✅ УСПІХ
    await this.usersService.setPremium(email);

    await this.paymentsRepo.save({
      orderId,
      email,
      status: "paid",
    });

    console.log("🎉 Premium activated for:", email);
  }
}
