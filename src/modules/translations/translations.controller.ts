// src/modules/translations/translations.controller.ts

import { Controller, Get, Query } from "@nestjs/common";
import { TranslationsService } from "./translations.service";

@Controller("translations")
export class TranslationsController {
  constructor(private readonly service: TranslationsService) {}

  @Get()
  async getAll(
    @Query("country") countrySlug?: string,
    @Query("zone") timeZoneCode?: string
  ) {
    return this.service.getAll(countrySlug, timeZoneCode);
  }
}
