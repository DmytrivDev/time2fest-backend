import { Controller, Get, Query } from '@nestjs/common';
import { AboutPageTopService } from './about-page-top.service';

@Controller('about-page-top')
export class AboutPageTopController {
  constructor(private readonly aboutPageTopService: AboutPageTopService) {}

  // GET /about-page-top?locale=uk
  @Get()
  async getAboutPageTop(@Query('locale') locale = 'en') {
    return this.aboutPageTopService.getAboutPageTop(locale);
  }
}
