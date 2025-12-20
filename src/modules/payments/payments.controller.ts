import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('ipn')
  @HttpCode(200)
  async handleIpn(@Body() payload: any) {
    console.log('📥 [PAYPRO IPN] Incoming');
    console.log('📦 Payload:', payload);

    await this.paymentsService.handlePayProIpn(payload);

    // PayPro expects 200 OK
    return 'OK';
  }
}
