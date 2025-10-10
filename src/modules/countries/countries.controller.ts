import { Controller, Get, Query } from '@nestjs/common';
import { CountriesService } from './countries.service';

@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  async findOne(
    @Query('code') code?: string,
    @Query('slug') slug?: string,
    @Query('locale') locale: string = 'en',
  ) {
    if (!code && !slug) {
      return { data: [], error: 'Either country code or slug is required' };
    }

    return this.countriesService.getCountry(code, slug, locale);
  }
}
