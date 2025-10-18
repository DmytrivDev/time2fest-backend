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
    // Якщо передано tz — пошук по часовій зоні
    if (tz) {
      return this.countriesService.getCountriesByTimeZone(
        tz,
        locale,
        page,
        limit
      );
    }

    // Якщо передано code або slug — пошук однієї країни
    if (code || slug) {
      return this.countriesService.getCountry(code, slug, locale);
    }

    // Інакше — усі країни (з пагінацією)
    return this.countriesService.getAllCountries(locale, page, limit);
  }
}
