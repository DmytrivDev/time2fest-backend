import {
  Controller,
  Post,
  Body,
  HttpCode,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Response } from "express";
import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * =====================================================
   * PAYPRO IPN (Webhook)
   * =====================================================
   * PayPro → backend
   * Активує Premium
   */
  @Post("ipn")
  @HttpCode(200)
  async handleIpn(@Body() payload: any) {
    await this.paymentsService.handlePayProIpn(payload);
    return "OK";
  }

  /**
   * =====================================================
   * FRONTEND → CREATE PAYPRO CHECKOUT LINK
   * =====================================================
   * Авторизований юзер
   */
  @Post("create-paypro-link")
  @UseGuards(JwtAuthGuard)
  async createPayProLink(@Req() req: any) {
    return this.paymentsService.createPayProCheckout(
      req.user.id,
      req.user.email
    );
  }

  /**
   * =====================================================
   * PAYPRO POST-REDIRECT HANDLER
   * =====================================================
   * PayPro робить POST після успішної оплати
   * Cloudflare пропускає POST тільки до backend
   * Ми відповідаємо 302 → React page
   */
  @Post("return")
  handlePayProReturn(@Res() res: Response) {
    return res.redirect(302, "/profile/success");
  }
}
