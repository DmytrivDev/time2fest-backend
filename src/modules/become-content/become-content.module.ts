// src/become-content/become-content.module.ts
import { Module } from '@nestjs/common';
import { BecomeContentService } from './become-content.service';
import { BecomeContentController } from './become-content.controller';
import { StrapiModule } from '../strapi/strapi.module';

@Module({
  imports: [StrapiModule],
  providers: [BecomeContentService],
  controllers: [BecomeContentController],
})
export class BecomeContentModule {}