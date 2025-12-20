import { Controller, Post, Req, Res, HttpCode } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ✅ ТІЛЬКИ IPN
  @Post('ipn')
  @HttpCode(200)
  async handleIpn(@Req() req: any, @Res() res: any) {
    console.log('📥 [PAYPRO IPN] Incoming');

    const payload = req.body;
    console.log('📦 Payload:', payload);

    try {
      await this.paymentsService.handlePayProIpn(payload);
      return res.send('OK');
    } catch (e) {
      console.error('❌ IPN error:', e);
      return res.status(400).send('ERROR');
    }
  }
}
