// src/faq-content/faq-content.module.ts
import { Module } from '@nestjs/common';
import { faqContentService } from './faq-content.service';
import { faqContentController } from './faq-content.controller';
import { StrapiModule } from '../strapi/strapi.module';

@Module({
  imports: [StrapiModule],
  providers: [faqContentService],
  controllers: [faqContentController],
})
export class faqContentModule {}