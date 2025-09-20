import { Controller, Get, Query } from '@nestjs/common';
import { AboutPageRestService } from './about-page-rest.service';

@Controller('about-page-rest')
export class AboutPageRestController {
  constructor(private readonly aboutPageRestService: AboutPageRestService) {}

  // GET /about-page-rest?locale=uk
  @Get()
  async getAboutPageRest(@Query('locale') locale = 'en') {
    return this.aboutPageRestService.getAboutPageRest(locale);
  }
}
