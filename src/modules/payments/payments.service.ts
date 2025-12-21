import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "crypto";
import { UserService } from "../user/user.service";
import { PaymentsRepository } from "./payments.repository";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly usersService: UserService,
    private readonly paymentsRepo: PaymentsRepository
  ) {}

  /* =====================================================
   * CREATE PAYPRO CHECKOUT
   * ===================================================== */
  async createPayProCheckout(
    userId: number,
    email: string,
    lang?: string
  ): Promise<{ url: string }> {
    const baseUrl = process.env.PAYPRO_PURCHASE_URL;
    if (!baseUrl) {
      throw new Error("PAYPRO_PURCHASE_URL is not configured");
    }

    const internalOrderId = `T2F-${Date.now()}-${userId}`;
    const finalLang = lang || "en";

    // ✅ 1. Створюємо PENDING
    await this.paymentsRepo.createPending({
      internalOrderId,
      userId,
      email,
      lang: finalLang,
    });

    // ✅ 2. Формуємо PayPro URL
    const params = new URLSearchParams({
      internal_order_id: internalOrderId,
      user_id: String(userId),
    });

    return {
      url: `${baseUrl}&${params.toString()}`,
    };
  }

  /* =====================================================
   * PAYPRO IPN
   * ===================================================== */
  async handlePayProIpn(payload: any): Promise<void> {
    if (!payload || !this.verifySignature(payload)) return;

    const {
      ORDER_ID,
      ORDER_STATUS,
      IPN_TYPE_NAME,
      CHECKOUT_QUERY_STRING,
      CUSTOMER_EMAIL,
    } = payload;

    if (await this.paymentsRepo.existsByOrderId(ORDER_ID)) {
      this.logger.warn(`Duplicate IPN ignored: ${ORDER_ID}`);
      return;
    }

    const params = new URLSearchParams(CHECKOUT_QUERY_STRING || "");
    const internalOrderId = params.get("internal_order_id");
    const userId = params.get("user_id") ? Number(params.get("user_id")) : null;

    if (
      ORDER_STATUS !== "Processed" ||
      IPN_TYPE_NAME !== "OrderCharged" ||
      !internalOrderId ||
      !userId
    ) {
      return;
    }

    // 🔐 ЄДИНЕ місце активації Premium
    await this.usersService.setPremiumById(userId);

    await this.paymentsRepo.markPaid({
      internalOrderId,
      orderId: ORDER_ID,
      email: CUSTOMER_EMAIL,
    });

    this.logger.log(`Premium activated for user ${userId}`);
  }

  /* =====================================================
   * LANG FOR REDIRECT
   * ===================================================== */
  async getLangByInternalOrderId(internalOrderId?: string): Promise<string> {
    if (!internalOrderId) return "en";

    return (
      (await this.paymentsRepo.getLangByInternalOrderId(internalOrderId)) ||
      "en"
    );
  }

  /* =====================================================
   * SIGNATURE CHECK
   * ===================================================== */
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

    const sourceString =
      ORDER_ID +
      ORDER_STATUS +
      ORDER_TOTAL_AMOUNT +
      CUSTOMER_EMAIL +
      validationKey +
      TEST_MODE +
      IPN_TYPE_NAME;

    const hash = createHash("sha256").update(sourceString).digest("hex");

    return hash === SIGNATURE;
  }
}
