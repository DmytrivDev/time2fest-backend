// src/modules/order/order.service.ts

import { Injectable, NotFoundException } from "@nestjs/common";
import { OrderRepository } from "./order.repository";
import { OrderDto } from "./order.dto";

@Injectable()
export class OrderService {
  constructor(private readonly orderRepo: OrderRepository) {}

  async getMyOrders(userId: number): Promise<OrderDto[]> {
    return this.orderRepo.findAllByUserId(userId);
  }

  async getMyOrderById(
    orderId: number,
    userId: number
  ): Promise<OrderDto> {
    const order = await this.orderRepo.findOneByIdForUser(orderId, userId);

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }
}
