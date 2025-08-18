// src/modules/time-zones/time-zones.service.ts
import { Injectable } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class TimeZonesService {
  constructor(private readonly strapi: StrapiService) {}

  // Усі таймзони з країнами
  async getAllTimeZones(locale = "uk") {
    const qs = new URLSearchParams();
    qs.set("locale", locale);
    qs.set("populate", "countries");

    const resp = await this.strapi.get(`/time-zones?${qs.toString()}`);

    if (!Array.isArray(resp)) return [];

    return resp.map((tz: any) => {
      const attrs = tz.attributes ?? tz;
      const countries = Array.isArray(attrs.countries?.data)
        ? attrs.countries.data
        : attrs.countries || [];

      const countryCodes = (countries as any[])
        .map((c: any) =>
          (c.attributes?.CountryCode ?? c.CountryCode ?? "")
            .toString()
            .toUpperCase()
        )
        .filter(Boolean);

      return {
        id: tz.id,
        code: attrs.code,
        offcet: attrs.offcet ?? attrs.offset ?? null,
        countryCodes,
      };
    });
  }

  // Країни для конкретної зони
  async getCountriesByTimeZones(code: string, locale = "uk") {
    const qs = new URLSearchParams();
    qs.set("filters[code][$eq]", code);
    qs.set("populate", "countries");
    qs.set("locale", locale);

    const resp: any = await this.strapi.get(`/time-zones?${qs.toString()}`);
    return resp?.data ?? [];
  }
}
