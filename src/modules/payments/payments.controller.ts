import {
  Controller,
  Post,
  Body,
  HttpCode,
  Req,
  UseGuards,
} from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * PAYPRO IPN
   */
  @Post("ipn")
  @HttpCode(200)
  async handleIpn(@Body() payload: any) {
    await this.paymentsService.handlePayProIpn(payload);
    return "OK";
  }

  /**
   * FRONTEND CHECKOUT
   */
  @Post("create-paypro-link")
  @UseGuards(JwtAuthGuard)
  async createPayProLink(@Req() req: any) {
    return this.paymentsService.createPayProCheckout(
      req.user.id,
      req.user.email
    );
  }
}
