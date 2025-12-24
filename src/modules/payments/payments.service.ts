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
   * PAYPRO IPN (WEBHOOK)
   * ===================================================== */
  async handlePayProIpn(payload: any): Promise<void> {
    if (!payload) return;

    if (!this.verifySignature(payload)) {
      this.logger.warn("Invalid PayPro signature");
      return;
    }

    const {
      ORDER_ID,
      ORDER_STATUS,
      IPN_TYPE_NAME,
      CHECKOUT_QUERY_STRING,
      CUSTOMER_EMAIL,
      INVOICE_LINK,
    } = payload;

    if (!CHECKOUT_QUERY_STRING) return;

    const params = new URLSearchParams(CHECKOUT_QUERY_STRING);
    const internalOrderId = params.get("internal_order_id");
    const userId = params.get("user_id") ? Number(params.get("user_id")) : null;

    if (!internalOrderId) return;

    const payment = await this.paymentsRepo.findByInternalOrderId(
      internalOrderId
    );

    // 🔒 Якщо вже paid — нічого не робимо
    if (payment?.status === "paid") {
      this.logger.log(`🔁 IPN ignored (already paid): ${internalOrderId}`);
      return;
    }

    /* ===============================
     * SUCCESS
     * =============================== */
    if (
      ORDER_STATUS === "Processed" &&
      IPN_TYPE_NAME === "OrderCharged" &&
      userId
    ) {
      await this.paymentsRepo.finalize({
        internalOrderId,
        status: "paid",
        orderId: ORDER_ID,
        email: CUSTOMER_EMAIL,
        invoiceLink: INVOICE_LINK,
      });

      await this.usersService.setPremiumById(userId);

      this.logger.log(
        `🎉 Premium activated for userId=${userId} (${ORDER_ID})`
      );
      return;
    }

    /* ===============================
     * FAILED
     * =============================== */
    if (ORDER_STATUS === "Declined" || ORDER_STATUS === "Failed") {
      await this.paymentsRepo.finalize({
        internalOrderId,
        status: "error",
        orderId: ORDER_ID,
        email: CUSTOMER_EMAIL,
        invoiceLink: INVOICE_LINK,
      });

      this.logger.warn(`❌ Payment failed: ${internalOrderId}`);
      return;
    }

    // ⚠️ ВСЕ ІНШЕ — лише лог
    this.logger.warn(
      `ℹ️ IPN ignored (non-final): ${internalOrderId} (${ORDER_STATUS})`
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
