import { Body, Controller, Post, Req, Res, HttpCode } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-checkout')
  async createCheckout(@Body() dto: CreateCheckoutDto) {
    console.log("➡️ [API] /create-checkout called with:", dto.email);
    const session = await this.paymentsService.createCheckout(dto.email);
    return { url: session.url };
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Req() req: any, @Res() res: any) {
    console.log("📥 [WEBHOOK] Incoming event");

    const rawBody = req.rawBody;
    const signature = req.headers['paddle-signature'];
    const timestamp = req.headers['paddle-timestamp'];

    console.log("🔐 Headers:", { signature, timestamp });

    const isValid = this.paymentsService.verifyWebhookSignature(
      rawBody,
      signature,
      timestamp,
    );

    if (!isValid) {
      console.error("❌ Invalid signature");
      return res.status(400).send("Invalid signature");
    }

    const event = JSON.parse(rawBody);
    console.log("📦 Event payload:", event);

    await this.paymentsService.handlePaddleEvent(event);
    return res.send("OK");
  }
}
 