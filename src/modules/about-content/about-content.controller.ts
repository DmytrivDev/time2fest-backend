// src/about-content/about-content.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { AboutContentService } from './about-content.service';

@Controller('about')
export class AboutContentController {
  constructor(private readonly aboutService: AboutContentService) {}

  // GET /about?locale=uk
  @Get()
  async getAbout(@Query('locale') locale = 'en') {
    return this.aboutService.getAboutContent(locale);
  }
}