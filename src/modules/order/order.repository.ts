// src/modules/order/order.repository.ts

import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { OrderDto } from "./order.dto";

@Injectable()
export class OrderRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findAllByUserId(userId: number): Promise<OrderDto[]> {
    return this.dataSource.query(
      `
      SELECT
        id,
        order_id,
        created_at,
        user_id,
        internal_order_id,
        invoice_link
      FROM payments
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );
  }

  async findOneByIdForUser(
    id: number,
    userId: number
  ): Promise<OrderDto | null> {
    const rows = await this.dataSource.query(
      `
      SELECT
        id,
        order_id,
        created_at,
        user_id,
        internal_order_id,
        invoice_link
      FROM payments
      WHERE id = $1
        AND user_id = $2
      LIMIT 1
      `,
      [id, userId]
    );

    return rows[0] || null;
  }
}
