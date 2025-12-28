import { Module } from '@nestjs/common';
import { MuxWebhookController } from './mux.controller';

@Module({
  controllers: [MuxWebhookController],
})
export class MuxWebhookModule {}
