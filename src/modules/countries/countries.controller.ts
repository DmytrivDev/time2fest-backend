import { Controller, Get, Query } from "@nestjs/common";
import { CountriesService } from "./countries.service";

@Controller("countries")
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  async findAll(
    @Query("code") code?: string,
    @Query("slug") slug?: string,
    @Query("tz") tz?: string, // ✅ новий параметр
    @Query("locale") locale: string = "en",
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    // 👉 Усе робить один метод getCountry — він уже вміє працювати і з tz, і з пагінацією
    return this.countriesService.getCountry(code, slug, locale, page, limit, tz);
  }
}
