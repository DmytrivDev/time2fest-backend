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
  // Країни для конкретної зони
  async getCountriesByTimeZones(code: string, locale = "uk") {
    const qs = new URLSearchParams();
    qs.set("filters[code][$eq]", code);
    qs.set("locale", locale);
    // просимо Strapi підтягнути всі вкладені дані
    qs.set("populate[countries][populate][0]", "TimezoneDetail");
    qs.set("populate[countries][populate][1]", "ambassadors");
    qs.set("populate[countries][populate][2]", "time_zones");
    qs.set("populate[countries][populate][3]", "Background");

    const resp: any = await this.strapi.get(`/time-zones?${qs.toString()}`);

    // ✅ Strapi зазвичай повертає { data: [...] }
    const zones = Array.isArray(resp?.data) ? resp.data : resp;
    if (!zones.length) return [];

    // ✅ Беремо першу зону (бо фільтр по code)
    const zone = zones[0];
    const attrs = zone.attributes ?? zone;

    // ✅ Розпаковуємо countries незалежно від структури
    const rawCountries =
      attrs.countries?.data ??
      attrs.countries ??
      zone.countries?.data ??
      zone.countries ??
      [];

    // ✅ Формуємо чисту відповідь з усіма вкладеними полями
    return rawCountries.map((c: any) => {
      const a = c.attributes ?? c;

      return {
        id: a.id ?? c.id,
        CountryName: a.CountryName,
        CountryCode: a.CountryCode,
        CountryDesc: a.CountryDesc,
        ShortDesc: a.ShortDesc,
        slug: a.slug,
        locale: a.locale ?? locale,

        // 🧠 Головне: TimezoneDetail
        TimezoneDetail:
          a.TimezoneDetail?.data ??
          a.TimezoneDetail ??
          c.TimezoneDetail?.data ??
          c.TimezoneDetail ??
          [],

        ambassadors:
          a.ambassadors?.data ?? a.ambassadors ?? c.ambassadors?.data ?? [],
        time_zones:
          a.time_zones?.data ?? a.time_zones ?? c.time_zones?.data ?? [],
        Background: a.Background ?? null,
      };
    });
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
