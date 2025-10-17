import { Controller, Get, Query } from "@nestjs/common";
import { CountriesService } from "./countries.service";

@Controller("countries")
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  async findOne(
    @Query("code") code?: string,
    @Query("slug") slug?: string,
    @Query("locale") locale: string = "en",
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    // Якщо не вказано code і slug → отримаємо всі країни
    return this.countriesService.getCountry(code, slug, locale, page, limit);
  }
}
