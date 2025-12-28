import { Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { MuxWebhookService } from './mux.service';

@Controller('webhooks/mux')
export class MuxWebhookController {
  constructor(private readonly muxService: MuxWebhookService) {}

  @Post()
  async handleMux(@Req() req: Request, @Res() res: Response) {
    const event = req.body;

    console.log('🔔 MUX WEBHOOK:', event.type);

    try {
      await this.muxService.handleEvent(event);
    } catch (e) {
      console.error('❌ MUX WEBHOOK ERROR:', e);
    }

    return res.status(200).send('ok');
  }
}
