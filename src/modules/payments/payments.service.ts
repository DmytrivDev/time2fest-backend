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

    // ✅ 1. Створюємо pending (ОДИН раз)
    await this.paymentsRepo.createPending({
      internalOrderId,
      userId,
      email,
      lang: lang && lang !== "en" ? lang : "en",
    });

    // ✅ 2. Формуємо PayPro URL
    const params = new URLSearchParams({
      internal_order_id: internalOrderId,
      user_id: String(userId),
      CUSTOMER_EMAIL: email,
    });

    return {
      url: `${baseUrl}&${params.toString()}`,
    };
  }

  /* =====================================================
   * PAYPRO IPN
   * ===================================================== */
  async handlePayProIpn(payload: any) {
    const orderId = String(payload.order_id);
    const internalOrderId = payload.internal_order_id;
    const email = payload.customer_email;

    if (!internalOrderId || !orderId) {
      return;
    }

    await this.paymentsRepo.markPaid({
      internalOrderId,
      orderId,
      email,
    });

    // тут активація Premium
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
