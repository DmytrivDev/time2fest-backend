import { Controller, Get, Query } from "@nestjs/common";
import { CountriesLightService } from "./countries-light.service";

@Controller("countries-light")
export class CountriesLightController {
  constructor(private readonly countriesLightService: CountriesLightService) {}

  @Get()
  async getLight(
    @Query("zones") zones: string,
    @Query("locale") locale = "en"
  ) {
    if (!zones) return [];

    // ✅ Парсимо без втрати двокрапок у часових зонах
    const pairs = zones
      .split(",")
      .map((pair) => {
        const firstColonIndex = pair.indexOf(":");
        if (firstColonIndex === -1) return null;

        const slug = pair.slice(0, firstColonIndex).trim();
        const zone = pair.slice(firstColonIndex + 1).trim();

        return slug && zone ? { slug, zone } : null;
      })
      .filter((p): p is { slug: string; zone: string } => p !== null); // 👈 ось це головне

    return this.countriesLightService.getLightCountries(pairs, locale);
  }
}
