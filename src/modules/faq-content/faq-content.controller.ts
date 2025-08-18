// src/faq-content/faq-content.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { faqContentService } from './faq-content.service';

@Controller('faq')
export class faqContentController {
  constructor(private readonly faqService: faqContentService) {}

  // GET /faq?locale=uk
  @Get()
  async getfaq(@Query('locale') locale = 'en') {
    return this.faqService.getfaqContent(locale);
  }
}