import { Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller('webhooks/mux')
export class MuxWebhookController {
  @Post()
  handleMux(@Req() req: Request, @Res() res: Response) {
    console.log('MUX WEBHOOK:', req.body);
    res.status(200).send('ok');
  }
}
