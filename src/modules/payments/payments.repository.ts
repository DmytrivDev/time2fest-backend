import { Injectable } from "@nestjs/common";
import { Pool } from "pg";

export type PaymentStatus = "pending" | "paid" | "error" | "ignored";

@Injectable()
export class PaymentsRepository {
  constructor(private readonly db: Pool) {}

  /* =====================================================
   * CHECK DUPLICATE IPN
   * ===================================================== */
  async exists(orderId: string): Promise<boolean> {
    const res = await this.db.query(
      "SELECT 1 FROM payments WHERE order_id = $1 LIMIT 1",
      [orderId]
    );

    return (res.rowCount ?? 0) > 0;
  }

  /* =====================================================
   * SAVE PAYMENT (pending / paid / error / ignored)
   * ===================================================== */
  async save(data: {
    orderId: string;
    status: PaymentStatus;
    userId?: number;
    internalOrderId?: string;
    email?: string;
    lang?: string;
  }): Promise<void> {
    await this.db.query(
      `
    INSERT INTO payments (
      order_id,
      user_id,
      internal_order_id,
      email,
      lang,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (order_id) DO NOTHING
    `,
      [
        data.orderId,
        data.userId ?? null,
        data.internalOrderId ?? null,
        data.email ?? null,
        data.lang ?? null,
        data.status,
      ]
    );
  }

  /* =====================================================
   * GET LANG FOR REDIRECT
   * ===================================================== */
  async getLangByInternalOrderId(
    internalOrderId: string
  ): Promise<string | null> {
    const res = await this.db.query(
      `
      SELECT lang
      FROM payments
      WHERE internal_order_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [internalOrderId]
    );

    return res.rows[0]?.lang ?? null;
  }
}
