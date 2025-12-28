import { Module } from '@nestjs/common';
import { MuxWebhookController } from './mux.controller';
import { MuxWebhookService } from './mux.service';
import { StrapiModule } from '../../modules/strapi/strapi.module';

@Module({
  imports: [StrapiModule],
  controllers: [MuxWebhookController],
  providers: [MuxWebhookService],
})
export class MuxWebhookModule {}
