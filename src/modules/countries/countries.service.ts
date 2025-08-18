// countries.service.ts
import { Injectable } from '@nestjs/common';
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class CountriesService {
  constructor(private readonly strapi: StrapiService) {}

  async getCountryByCode(countryCode: string, locale = 'uk') {
    // нормалізуємо код країни у верхній регістр
    const normalized = countryCode.toUpperCase();

    const qs = new URLSearchParams();
    qs.set('filters[CountryCode][$eq]', normalized);
    qs.set('locale', locale);

    const url = `/countries?${qs.toString()}`;
    return this.strapi.get(url);
  }
}
