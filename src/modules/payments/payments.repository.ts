import { Injectable } from "@nestjs/common";
import { Pool } from "pg";

export type PaymentStatus = "paid" | "error" | "ignored";

@Injectable()
export class PaymentsRepository {
  constructor(private readonly db: Pool) {}

  async exists(orderId: string): Promise<boolean> {
    const res = await this.db.query(
      "SELECT 1 FROM payments WHERE order_id = $1 LIMIT 1",
      [orderId]
    );

    return (res.rowCount ?? 0) > 0;
  }

  async save(data: {
    orderId: string;
    status: PaymentStatus;
    userId?: number;
    internalOrderId?: string;
    email?: string;
  }): Promise<void> {
    await this.db.query(
      `
      INSERT INTO payments (
        order_id,
        user_id,
        internal_order_id,
        email,
        status
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (order_id) DO NOTHING
      `,
      [
        data.orderId,
        data.userId ?? null,
        data.internalOrderId ?? null,
        data.email ?? null,
        data.status,
      ]
    );
  }
}
