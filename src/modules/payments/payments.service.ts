import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "crypto";
import { UserService } from "../user/user.service";
import { PaymentsRepository, PaymentStatus } from "./payments.repository";

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

    if (!payload || typeof payload !== "object") {
      return;
    }

    if (!this.verifySignature(payload)) {
      this.logger.error("❌ Invalid PayPro signature");
      return;
    }

    const context = this.buildContext(payload);

    if (await this.paymentsRepo.exists(context.orderId)) {
      this.logger.warn(`🔁 Duplicate IPN ignored: ${context.orderId}`);
      return;
    }

    if (!context.isSuccessful) {
      await this.save(context, "ignored");
      return;
    }

    if (!context.userId || !context.internalOrderId) {
      this.logger.error("❌ Missing userId or internalOrderId", context);
      await this.save(context, "error");
      return;
    }

    // 🔐 ЄДИНЕ МІСЦЕ активації Premium
    await this.usersService.setPremiumById(context.userId);

    await this.save(context, "paid");

    this.logger.log(
      `🎉 Premium activated for userId=${context.userId} (${context.orderId})`
    );
  }

  /* =====================================
   * CHECKOUT
   * ===================================== */
  async createPayProCheckout(userId: number): Promise<{ url: string }> {
    const baseUrl = process.env.PAYPRO_PURCHASE_URL;

    if (!baseUrl) {
      throw new Error("PAYPRO_PURCHASE_URL is not configured");
    }

    const internalOrderId = `T2F-${Date.now()}-${userId}`;

    const params = new URLSearchParams({
      user_id: String(userId),
      internal_order_id: internalOrderId,
    });

    return {
      url: `${baseUrl}&${params.toString()}`,
    };
  }

  /* =====================================
   * CONTEXT
   * ===================================== */
  private buildContext(payload: any) {
    const {
      ORDER_ID,
      ORDER_STATUS,
      IPN_TYPE_NAME,
      CHECKOUT_QUERY_STRING,
      CUSTOMER_EMAIL,
    } = payload;

    const { userId, internalOrderId } = this.extractIdsFromCheckoutQuery(
      CHECKOUT_QUERY_STRING
    );

    return {
      orderId: ORDER_ID as string,
      userId,
      internalOrderId,
      email: CUSTOMER_EMAIL as string | undefined,
      isSuccessful:
        ORDER_STATUS === "Processed" && IPN_TYPE_NAME === "OrderCharged",
    };
  }

  /* =====================================
   * SIGNATURE
   * ===================================== */
  private verifySignature(payload: any): boolean {
    const validationKey = process.env.PAYPRO_VALIDATION_KEY;

    if (!validationKey) {
      this.logger.error("PAYPRO_VALIDATION_KEY not set");
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

    if (
      !ORDER_ID ||
      !ORDER_STATUS ||
      !ORDER_TOTAL_AMOUNT ||
      !CUSTOMER_EMAIL ||
      TEST_MODE === undefined ||
      !IPN_TYPE_NAME ||
      !SIGNATURE
    ) {
      return false;
    }

    const sourceString =
      String(ORDER_ID) +
      String(ORDER_STATUS) +
      String(ORDER_TOTAL_AMOUNT) +
      String(CUSTOMER_EMAIL) +
      String(validationKey) +
      String(TEST_MODE) +
      String(IPN_TYPE_NAME);

    const calculatedHash = createHash("sha256")
      .update(sourceString)
      .digest("hex");

    return calculatedHash === SIGNATURE;
  }

  /* =====================================
   * HELPERS
   * ===================================== */
  private extractIdsFromCheckoutQuery(query?: string) {
    if (!query) {
      return { userId: null, internalOrderId: null };
    }

    const params = new URLSearchParams(query);

    const userId = params.get("user_id");
    const internalOrderId = params.get("internal_order_id");

    return {
      userId: userId ? Number(userId) : null,
      internalOrderId,
    };
  }

  private async save(
    context: {
      orderId: string;
      userId?: number | null;
      internalOrderId?: string | null;
      email?: string;
    },
    status: PaymentStatus
  ): Promise<void> {
    await this.paymentsRepo.save({
      orderId: context.orderId,
      userId: context.userId ?? undefined,
      internalOrderId: context.internalOrderId ?? undefined,
      email: context.email,
      status,
    });
  }
}
