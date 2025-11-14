import { Body, Controller, Post, Req, Res, HttpCode } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ───────────────────────────────────────────────
  // Create checkout session
  // ───────────────────────────────────────────────
  @Post('create-checkout')
  async createCheckout(@Body() dto: CreateCheckoutDto) {
    const session = await this.paymentsService.createCheckout(dto.email);
    return { url: session.url };
  }

  // ───────────────────────────────────────────────
  // Webhook endpoint
  // ───────────────────────────────────────────────
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Req() req: any, @Res() res: any) {
    const rawBody = req.rawBody;
    const signature = req.headers['paddle-signature'];
    const timestamp = req.headers['paddle-timestamp'];

    const isValid = this.paymentsService.verifyWebhookSignature(
      rawBody,
      signature,
      timestamp,
    );

    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return res.status(400).send('Invalid signature');
    }

    const event = JSON.parse(rawBody);
    await this.paymentsService.handlePaddleEvent(event);

    return res.send('OK');
  }
}
