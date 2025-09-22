import { Controller, Get, Query } from '@nestjs/common';
import { AmbassPageTopService } from './ambass-page-top.service';

@Controller('ambass-page-top')
export class AmbassPageTopController {
  constructor(private readonly ambassPageTopService: AmbassPageTopService) {}

  // GET /ambass-page-top?locale=uk
  @Get()
  async getAmbassPageTop(@Query('locale') locale = 'en') {
    return this.ambassPageTopService.getAmbassPageTop(locale);
  }
}
