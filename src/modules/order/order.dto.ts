// src/modules/order/order.dto.ts

export class OrderDto {
  id?: number;
  order_id?: string | null;
  created_at?: Date;
  user_id?: number;
  internal_order_id?: string | null;
  invoice_link?: string | null;
}
