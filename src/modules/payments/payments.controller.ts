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
   * ЄДИНЕ місце, де активується Premium
   */
  @Post("ipn")
  @HttpCode(200)
  async handleIpn(@Body() payload: any) {
    await this.paymentsService.handlePayProIpn(payload);
    return "OK";
  }

  /**
   * =====================================================
   * CREATE PAYPRO CHECKOUT LINK
   * =====================================================
   * Авторизований юзер
   * Передаємо lang з фронту
   */
  @Post("create-paypro-link")
  @UseGuards(JwtAuthGuard)
  async createPayProLink(@Req() req: any, @Body("lang") lang: string) {
    return this.paymentsService.createPayProCheckout(
      req.user.id,
      req.user.email,
      lang
    );
  }

  /**
   * =====================================================
   * PAYPRO POST-REDIRECT HANDLER
   * =====================================================
   * PayPro → POST
   * Cloudflare → OK
   * Backend → 302 на мовний success
   */
  @Post("return")
  async handlePayProReturn(@Req() req: any, @Res() res: Response) {
    const internalOrderId = req.query.internal_order_id;

    const lang = await this.paymentsService.getLangByInternalOrderId(
      internalOrderId
    );

    const prefix = lang && lang !== "en" ? `/${lang}` : "";

    return res.redirect(302, `${prefix}/profile/success`);
  }
}
