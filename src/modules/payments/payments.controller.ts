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
  async handleIpn(@Req() req: any, @Body() payload: any) {
    await this.paymentsService.handlePayProIpn(payload, req.rawBody);
    return "OK";
  }

  /**
   * FRONTEND CHECKOUT
   */
  @UseGuards(JwtAuthGuard)
  @Post("create-paypro-link")
  async createPayProLink() {
    return this.paymentsService.createPayProCheckout();
  }
}
