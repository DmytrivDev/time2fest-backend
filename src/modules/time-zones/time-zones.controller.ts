// src/modules/time-zones/time-zones.controller.ts
import { Controller, Get, Param, Query } from "@nestjs/common";
import { TimeZonesService } from "./time-zones.service";

@Controller("time-zones")
export class TimeZonesController {
  constructor(private readonly tzService: TimeZonesService) {}

  @Get()
  async getAll(@Query("locale") locale = "uk") {
    return this.tzService.getAllTimeZones(locale); // вже масив [{id, code, countryCodes}]
  }

  @Get(":code/countries")
  async getCountries(
    @Param("code") code: string,
    @Query("locale") locale = "uk"
  ) {
    return this.tzService.getCountriesByTimeZones(code, locale);
  }
}
