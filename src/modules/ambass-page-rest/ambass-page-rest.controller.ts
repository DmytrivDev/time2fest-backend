import { Controller, Get, Query } from '@nestjs/common';
import { AmbassPageRestService } from './ambass-page-rest.service';

@Controller('ambass-page-rest')
export class AmbassPageRestController {
  constructor(private readonly ambassPageRestService: AmbassPageRestService) {}

  // GET /ambass-page-rest?locale=uk
  @Get()
  async getAmbassPageRest(@Query('locale') locale = 'en') {
    return this.ambassPageRestService.getAmbassPageRest(locale);
  }
}
