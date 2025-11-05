import { Controller, Get, Query } from "@nestjs/common";
import { CountriesLightService } from "./countries-light.service";

@Controller("countries-light")
export class CountriesLightController {
  constructor(private readonly countriesLightService: CountriesLightService) {}

  /**
   * GET /api/countries-light?zones=ukraine:UTC+2,fiji:UTC+12&locale=en
   * Повертає легкі дані для графіка святкувань.
   */
  @Get()
  async getLight(
    @Query("zones") zones: string,
    @Query("locale") locale = "en"
  ) {
    if (!zones) return [];

    // приклад: zones=ukraine:UTC+2,new-zealand:UTC+13
    const pairs = zones
      .split(",")
      .map(pair => {
        const [slug, zone] = pair.split(":");
        return { slug: slug?.trim(), zone: zone?.trim() };
      })
      .filter(p => p.slug && p.zone);

    return this.countriesLightService.getLightCountries(pairs, locale);
  }
}
