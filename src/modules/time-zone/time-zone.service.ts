// src/modules/time-zone/time-zone.service.ts
import { Injectable } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class TimeZoneService {
  constructor(private readonly strapi: StrapiService) {}

  async getCountriesByTimeZone(code: string, locale = "uk") {
    const qs = new URLSearchParams();
    qs.set("filters[code][$eq]", code);
    qs.set("populate", "countries");
    qs.set("locale", locale);

    return this.strapi.get(`/time-zones?${qs.toString()}`);
  }
}