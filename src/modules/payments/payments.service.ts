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

  /* =====================================================
   * PAYPRO IPN
   * ===================================================== */
  async handlePayProIpn(payload: any): Promise<void> {
    this.logger.log("📦 PAYPRO IPN RECEIVED");

    if (!payload || typeof payload !== "object") return;
    if (!this.verifySignature(payload)) return;

    const context = this.buildContext(payload);

    if (await this.paymentsRepo.exists(context.orderId)) {
      this.logger.warn(`🔁 Duplicate IPN ignored: ${context.orderId}`);
      return;
    }

    if (!context.isSuccessful) {
      await this.save(context, "ignored");
      return;
    }

    if (!context.userId) {
      await this.save(context, "error");
      return;
    }

    // 🔐 ЄДИНЕ місце активації Premium
    await this.usersService.setPremiumById(context.userId);

    await this.save(context, "paid");

    this.logger.log(
      `🎉 Premium activated for userId=${context.userId} (${context.orderId})`
    );
  }

  /* =====================================================
   * CREATE CHECKOUT
   * ===================================================== */
  async createPayProCheckout(
    userId: number,
    email: string,
    lang: string
  ): Promise<{ url: string }> {
    const baseUrl = process.env.PAYPRO_PURCHASE_URL;
    if (!baseUrl) throw new Error("PAYPRO_PURCHASE_URL not configured");

    const internalOrderId = `T2F-${Date.now()}-${userId}`;

    // ⬇️ Зберігаємо pending платіж з мовою
    await this.paymentsRepo.save({
      orderId: internalOrderId,
      userId,
      internalOrderId,
      email,
      lang,
      status: "pending",
    });

    const params = new URLSearchParams({
      user_id: String(userId),
      internal_order_id: internalOrderId,
      CUSTOMER_EMAIL: email,
    });

    return { url: `${baseUrl}&${params.toString()}` };
  }

  /* =====================================================
   * LANG FOR REDIRECT
   * ===================================================== */
  async getLangByInternalOrderId(internalOrderId?: string): Promise<string> {
    if (!internalOrderId) return "en";

    const lang = await this.paymentsRepo.getLangByInternalOrderId(
      internalOrderId
    );

    return lang || "en";
  }

  /* =====================================================
   * HELPERS
   * ===================================================== */
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
      orderId: ORDER_ID,
      userId,
      internalOrderId,
      email: CUSTOMER_EMAIL,
      isSuccessful:
        ORDER_STATUS === "Processed" && IPN_TYPE_NAME === "OrderCharged",
    };
  }

  private extractIdsFromCheckoutQuery(query?: string) {
    if (!query) return { userId: null, internalOrderId: null };

    const params = new URLSearchParams(query);
    return {
      userId: params.get("user_id") ? Number(params.get("user_id")) : null,
      internalOrderId: params.get("internal_order_id"),
    };
  }

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

    const hash = createHash("sha256").update(sourceString).digest("hex");
    return hash === SIGNATURE;
  }

  private async save(
    context: {
      orderId: string;
      userId?: number | null;
      internalOrderId?: string | null;
      email?: string;
      lang?: string;
    },
    status: PaymentStatus
  ) {
    await this.paymentsRepo.save({
      orderId: context.orderId,
      userId: context.userId ?? undefined,
      internalOrderId: context.internalOrderId ?? undefined,
      email: context.email,
      lang: context.lang,
      status,
    });
  }
}
