// src/become-content/become-content.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { BecomeContentService } from './become-content.service';

@Controller('become')
export class BecomeContentController {
  constructor(private readonly becomeService: BecomeContentService) {}

  // GET /become?locale=uk
  @Get()
  async getBecome(@Query('locale') locale = 'en') {
    return this.becomeService.getBecomeContent(locale);
  }
}