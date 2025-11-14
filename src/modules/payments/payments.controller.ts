import { Body, Controller, Post, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { verifyPaddleSignature } from './utils/verifyPaddleSignature';
import { UserService } from '../user/user.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly usersService: UserService,
  ) {}

  @Post('create-checkout')
  async createCheckout(@Body() dto: CreateCheckoutDto) {
    const session = await this.paymentsService.createCheckout(dto.email);
    return { url: session.url };
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: any,
  ) {
    const signature = req.headers['paddle-signature'];
    const rawBody = req.rawBody;

    if (!verifyPaddleSignature(rawBody, signature)) return;

    const event = JSON.parse(rawBody);

    if (event.type === 'transaction.completed') {
      const email = event.data.customer.email;

      await this.usersService.setPremium(email);
    }

    return { status: 'ok' };
  }
}
