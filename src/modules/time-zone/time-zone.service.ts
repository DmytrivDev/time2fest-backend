// src/modules/time-zone/time-zone.service.ts
import { Injectable } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class TimeZoneService {
  constructor(private readonly strapi: StrapiService) {}

  async getCountriesByTimeZone(code: string, locale = "uk") {
    const filters = new URLSearchParams();
    filters.set("filters[code][$eq]", code);
    filters.set("locale", locale);

    // ❗ формуємо populate окремо
    const populate = encodeURIComponent(
      JSON.stringify({
        countries: {
          populate: [
            "TimezoneDetail",
            "ambassadors",
            "time_zones",
            "Background",
          ],
        },
      })
    );

    const url = `/time-zones?${filters.toString()}&populate=${populate}`;

    const resp: any = await this.strapi.get(url);

    const zones = Array.isArray(resp?.data) ? resp.data : resp;
    if (!zones.length) return [];

    const zone = zones[0];
    const attrs = zone.attributes ?? zone;
    const countries =
      attrs.countries?.data ?? attrs.countries ?? zone.countries?.data ?? [];

    return countries.map((c: any) => {
      const a = c.attributes ?? c;
      return {
        id: a.id ?? c.id,
        CountryName: a.CountryName,
        CountryCode: a.CountryCode,
        CountryDesc: a.CountryDesc,
        ShortDesc: a.ShortDesc,
        slug: a.slug,
        locale: a.locale ?? locale,
        TimezoneDetail:
          a.TimezoneDetail?.data ??
          a.TimezoneDetail ??
          c.TimezoneDetail?.data ??
          c.TimezoneDetail ??
          [],
      };
    });
  }
}
