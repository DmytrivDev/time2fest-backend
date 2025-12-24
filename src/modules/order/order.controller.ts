// src/modules/order/order.controller.ts

import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OrderService } from "./order.service";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * ===============================
   * GET /orders
   * ===============================
   * Всі замовлення поточного юзера
   */
  @Get()
  async getMyOrders(@Req() req: any) {
    return this.orderService.getMyOrders(req.user.id);
  }

  /**
   * ===============================
   * GET /orders/:id
   * ===============================
   * Одне замовлення поточного юзера
   */
  @Get(":id")
  async getMyOrder(
    @Req() req: any,
    @Param("id", ParseIntPipe) id: number
  ) {
    return this.orderService.getMyOrderById(id, req.user.id);
  }
}
