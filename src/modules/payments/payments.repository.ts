import { Injectable } from "@nestjs/common";
import { Pool } from "pg";

export type PaymentStatus = "pending" | "paid" | "error" | "ignored";

@Injectable()
export class PaymentsRepository {
  constructor(private readonly db: Pool) {}

  /* ============================================
   * CREATE PENDING (ONE ROW PER CHECKOUT)
   * ============================================ */
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
      [
        data.internalOrderId,
        data.userId,
        data.email,
        data.lang,
      ]
    );
  }

  /* ============================================
   * FINALIZE PAYMENT (paid / error / ignored)
   * ============================================ */
  async finalize(data: {
    internalOrderId: string;
    status: PaymentStatus;
    orderId?: string;
    email?: string;
  }): Promise<void> {
    await this.db.query(
      `
      UPDATE payments
      SET
        status = $2,
        order_id = COALESCE($3, order_id),
        email = COALESCE($4, email)
      WHERE internal_order_id = $1
      `,
      [
        data.internalOrderId,
        data.status,
        data.orderId ?? null,
        data.email ?? null,
      ]
    );
  }

  /* ============================================
   * GET LANG FOR REDIRECT
   * ============================================ */
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
