// countries.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { CountriesService } from './countries.service';

@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  async findOne(
    @Query('code') code: string,
    @Query('locale') locale: string = 'en',
  ) {
    if (!code) {
      return { data: [], error: 'Country code is required' };
    }
    return this.countriesService.getCountryByCode(code, locale);
  }
}
