import { Controller, Get, Query } from '@nestjs/common';
import { TextService } from './text.service';

@Controller('text')
export class TextController {
  constructor(private readonly textService: TextService) {}

  // GET /text?page=privacy&locale=uk
  @Get()
  async getTextPage(
    @Query('page') page: string,
    @Query('locale') locale = 'en',
  ) {
    return this.textService.getTextPage(page, locale);
  }
}
