import { Injectable } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class TimeZonesService {
  constructor(private readonly strapi: StrapiService) {}

  // 🔹 Усі таймзони з країнами
  async getAllTimeZones(locale = "uk") {
    const qs = new URLSearchParams();
    qs.set("locale", locale);
    qs.set("populate", "countries");
    qs.set("pagination[pageSize]", "100");

    const resp: any = await this.strapi.get(`/time-zones?${qs.toString()}`);
    const data = Array.isArray(resp?.data) ? resp.data : resp;

    if (!Array.isArray(data)) return [];

    const zones = data.map((tz: any) => {
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

      const code = attrs.code;
      const offset = attrs.offcet ?? attrs.offset ?? null;
      const offsetMinutes = this.parseOffset(code);

      return {
        id: tz.id ?? attrs.id,
        code,
        offset,
        offsetMinutes,
        countryCodes,
      };
    });

    return this.sortTimeZones(zones);
  }

  // 🔹 Країни для конкретної зони
  async getCountriesByTimeZones(code: string, locale = "uk") {
    const qs = new URLSearchParams();
    qs.set("filters[code][$eq]", code);
    qs.set("locale", locale);
    // просимо Strapi підтягнути деталі таймзони всередині країн
    qs.set("populate[countries][populate][0]", "TimezoneDetail");
    qs.set("populate[countries][populate][1]", "time_zones");
    qs.set("populate[countries][populate][2]", "ambassadors");

    const resp: any = await this.strapi.get(`/time-zones?${qs.toString()}`);
    const data = Array.isArray(resp?.data) ? resp.data : resp;

    if (!data.length) return [];

    // беремо першу зону, бо фільтр по code повертає одну
    const zone = data[0];
    const attrs = zone.attributes ?? zone;

    // розпаковуємо країни (з урахуванням варіацій Strapi)
    const rawCountries =
      attrs.countries?.data ??
      attrs.countries ??
      zone.countries?.data ??
      zone.countries ??
      [];

    // формуємо масив чистих країн
    const countries = rawCountries.map((item: any) => {
      const attrs = item.attributes ?? item;

      // TimezoneDetail може бути або всередині attributes, або в .data
      const tzDetails =
        attrs.TimezoneDetail?.data ??
        attrs.TimezoneDetail ??
        item.TimezoneDetail?.data ??
        item.TimezoneDetail ??
        [];

      const timeZones =
        attrs.time_zones?.data ??
        attrs.time_zones ??
        item.time_zones?.data ??
        item.time_zones ??
        [];

      const ambassadors =
        attrs.ambassadors?.data ??
        attrs.ambassadors ??
        item.ambassadors?.data ??
        item.ambassadors ??
        [];

      return {
        id: attrs.id ?? item.id,
        CountryName: attrs.CountryName,
        CountryCode: attrs.CountryCode,
        CountryDesc: attrs.CountryDesc,
        ShortDesc: attrs.ShortDesc,
        slug: attrs.slug,
        locale: attrs.locale ?? locale,
        TimezoneDetail: tzDetails,
        time_zones: timeZones,
        ambassadors,
        Background: attrs.Background ?? null,
      };
    });

    return countries;
  }

  // 🔹 Парсимо "UTC±X(:Y)" -> offset у хвилинах
  private parseOffset(code: string): number {
    if (!code || !code.startsWith("UTC")) return 0;
    const match = code.match(/^UTC([+-])(\d{1,2})(?::(\d{2}))?$/);
    if (!match) return 0;

    const sign = match[1] === "-" ? -1 : 1;
    const hours = parseInt(match[2], 10);
    const minutes = match[3] ? parseInt(match[3], 10) : 0;

    return sign * (hours * 60 + minutes);
  }

  // 🔹 Сортування таймзон
  private sortTimeZones(zones: any[]) {
    const positives = zones
      .filter((z) => z.offsetMinutes >= 0)
      .sort((a, b) => b.offsetMinutes - a.offsetMinutes);

    const negatives = zones
      .filter((z) => z.offsetMinutes < 0)
      .sort((a, b) => {
        const absA = Math.abs(a.offsetMinutes);
        const absB = Math.abs(b.offsetMinutes);

        const isHalfA = absA % 60 !== 0;
        const isHalfB = absB % 60 !== 0;

        if (Math.floor(absA / 60) === Math.floor(absB / 60)) {
          if (!isHalfA && isHalfB) return -1;
          if (isHalfA && !isHalfB) return 1;
          return absA - absB;
        }

        return absA - absB;
      });

    return [...positives, ...negatives];
  }
}
