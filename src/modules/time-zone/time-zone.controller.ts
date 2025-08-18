// src/modules/time-zone/time-zone.controller.ts
import { Controller, Get, Param, Query } from "@nestjs/common";
import { TimeZoneService } from "./time-zone.service";

@Controller("time-zone")
export class TimeZoneController {
  constructor(private readonly tzService: TimeZoneService) {}

  // GET /time-zone/UTC+2/countries?locale=uk
  @Get(":code/countries")
  async getCountries(
    @Param("code") code: string,
    @Query("locale") locale = "uk"
  ) {
    return this.tzService.getCountriesByTimeZone(code, locale);
  }
}
