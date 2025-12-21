import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";
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
   * PAYPRO IPN HANDLER
   * ===================================== */
  async handlePayProIpn(payload: any): Promise<void> {
    console.log("📦 FULL IPN PAYLOAD:", JSON.stringify(payload, null, 2));

    if (!payload || typeof payload !== "object") {
      console.warn("⚠️ Invalid IPN payload");
      return;
    }

    // 🔐 IPN signature verification
    if (!this.verifyPayProIpn(payload)) {
      console.warn("❌ IPN signature verification failed");
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

    // ✅ Successful payment definition
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

    // 🎉 SUCCESS
    await this.usersService.setPremium(email);
    await this.savePayment(orderId, "paid", email);

    console.log("🎉 Premium activated for:", email);
  }

  /* =====================================
   * CHECKOUT (FRONTEND ENTRY)
   * ===================================== */
  async createPayProCheckout(): Promise<{ url: string }> {
    const url = process.env.PAYPRO_PURCHASE_URL;

    if (!url) {
      throw new Error("PAYPRO_PURCHASE_URL is not configured");
    }

    return { url };
  }

  /* =====================================
   * IPN SIGNATURE VALIDATION
   * ===================================== */
  private verifyPayProIpn(payload: any): boolean {
    const shouldVerify = process.env.PAYPRO_IPN_VERIFY === "true";

    if (!shouldVerify) {
      console.warn("⚠️ PAYPRO IPN verification disabled (DEV MODE)");
      return true;
    }

    const validationKey = process.env.PAYPRO_VALIDATION_KEY;
    if (!validationKey) {
      console.error("❌ PAYPRO_VALIDATION_KEY is missing");
      return false;
    }

    const receivedHash = payload.HASH;
    if (!receivedHash) {
      console.warn("❌ IPN without HASH");
      return false;
    }

    // Формуємо строку з payload без HASH
    const dataString = Object.keys(payload)
      .filter((key) => key !== "HASH")
      .sort()
      .map((key) => String(payload[key]))
      .join("");

    const calculatedHash = crypto
      .createHash("sha256")
      .update(dataString + validationKey)
      .digest("hex");

    const isValid = calculatedHash === receivedHash;

    if (!isValid) {
      console.error("❌ Invalid PayPro IPN signature", {
        receivedHash,
        calculatedHash,
      });
    }

    return isValid;
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
}
