import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";
import { AxiosError } from "axios";

@Injectable()
export class TimeZoneService {
  constructor(private readonly strapi: StrapiService) {}

  async getCountriesByTimeZone(code: string, locale = "uk") {
    try {
      // 👉 формуємо фільтри
      const qs = new URLSearchParams();
      qs.set("filters[code][$eq]", code);
      qs.set("locale", locale);

      // 👉 залишаємо тільки TimezoneDetail
      qs.set("populate[countries][populate][0]", "TimezoneDetail");

      // 👉 фінальний URL
      const url = `/time-zones?${qs.toString()}`;
      console.log("🧭 Fetching from Strapi:", url);

      // 👉 запит до Strapi
      const resp: any = await this.strapi.get(url);
      if (!resp) return [];

      const zones = Array.isArray(resp.data) ? resp.data : resp;
      if (!zones?.length) return [];

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
    } catch (err) {
      const error = err as AxiosError;
      console.error(
        "🔥 TimeZoneService error:",
        error.response?.data || error.message
      );
      throw new InternalServerErrorException("Failed to load time zone data");
    }
  }
}
