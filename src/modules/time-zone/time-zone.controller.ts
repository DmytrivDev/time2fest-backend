import { Controller, Get, Param, Query } from "@nestjs/common";
import { TimeZoneService } from "./time-zone.service";

@Controller("time-zone")
export class TimeZoneController {
  constructor(private readonly tzService: TimeZoneService) {}

  // GET /time-zone/UTC+1/countries?locale=en
  @Get(":code/countries")
  async getCountries(
    @Param("code") code: string,
    @Query("locale") locale = "uk"
  ) {
    console.log("🌍 Requested code:", code, "locale:", locale);
    return this.tzService.getCountriesByTimeZone(code, locale);
  }
}
