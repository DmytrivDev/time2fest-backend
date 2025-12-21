import { Injectable } from "@nestjs/common";
import { Pool } from "pg";

export type PaymentStatus = "pending" | "paid" | "error" | "ignored";

@Injectable()
export class PaymentsRepository {
  constructor(private readonly db: Pool) {}

  /* =====================================================
   * CREATE PENDING PAYMENT (BEFORE REDIRECT)
   * ===================================================== */
  async createPending(data: {
    internalOrderId: string;
    userId: number;
    email: string;
    lang: string;
  }): Promise<void> {
    await this.db.query(
      `
      INSERT INTO payments (
        internal_order_id,
        user_id,
        email,
        lang,
        status
      )
      VALUES ($1, $2, $3, $4, 'pending')
      ON CONFLICT (internal_order_id) DO NOTHING
      `,
      [data.internalOrderId, data.userId, data.email, data.lang]
    );
  }

  /* =====================================================
   * MARK PAYMENT AS PAID (FROM IPN)
   * ===================================================== */
  async markPaid(params: {
    internalOrderId: string;
    orderId: string;
    email?: string;
  }): Promise<void> {
    await this.db.query(
      `
      UPDATE payments
      SET
        status = 'paid',
        order_id = $1,
        email = COALESCE($2, email)
      WHERE internal_order_id = $3
      `,
      [params.orderId, params.email ?? null, params.internalOrderId]
    );
  }

  /* =====================================================
   * CHECK DUPLICATE IPN
   * ===================================================== */
  async existsByOrderId(orderId: string): Promise<boolean> {
    const res = await this.db.query(
      `SELECT 1 FROM payments WHERE order_id = $1 LIMIT 1`,
      [orderId]
    );
    return (res.rowCount ?? 0) > 0;
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
      LIMIT 1
      `,
      [internalOrderId]
    );

    return res.rows[0]?.lang ?? null;
  }
}
