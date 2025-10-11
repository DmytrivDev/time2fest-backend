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
    qs.set("pagination[pageSize]", "100");

    const resp = await this.strapi.get(`/time-zones?${qs.toString()}`);

    if (!Array.isArray(resp)) return [];

    const zones = resp.map((tz: any) => {
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
        id: tz.id,
        code,
        offset,
        offsetMinutes,
        countryCodes,
      };
    });

    return this.sortTimeZones(zones);
  }

  // Країни для конкретної зони
  async getCountriesByTimeZones(code: string, locale = "uk") {
    const qs = new URLSearchParams();
    qs.set("filters[code][$eq]", code);
    qs.set("locale", locale);
    qs.set("populate[countries][populate][0]", "TimezoneDetail");

    const resp: any = await this.strapi.get(`/time-zones?${qs.toString()}`);

    if (!resp || !resp.data || !resp.data.length) {
      return [];
    }

    // 🔍 Розпаковуємо країни навіть якщо вони всередині .data
    const rawCountries =
      resp.data[0]?.attributes?.countries?.data ??
      resp.data[0]?.countries ??
      [];

    const countries = rawCountries.map((item: any) => {
      const attrs = item.attributes ?? item;
      return {
        id: attrs.id ?? item.id,
        CountryName: attrs.CountryName,
        CountryCode: attrs.CountryCode,
        CountryDesc: attrs.CountryDesc,
        ShortDesc: attrs.ShortDesc,
        slug: attrs.slug,
        TimezoneDetail: attrs.TimezoneDetail ?? [],
      };
    });

    return countries;
  }

  // Парсимо "UTC±X(:Y)" -> offset у хвилинах
  private parseOffset(code: string): number {
    if (!code || !code.startsWith("UTC")) return 0;
    const match = code.match(/^UTC([+-])(\d{1,2})(?::(\d{2}))?$/);
    if (!match) return 0;

    const sign = match[1] === "-" ? -1 : 1;
    const hours = parseInt(match[2], 10);
    const minutes = match[3] ? parseInt(match[3], 10) : 0;

    return sign * (hours * 60 + minutes);
  }

  // Сортування: + (включно з 0) у зворотному порядку, мінуси — особливим чином
  private sortTimeZones(zones: any[]) {
    const positives = zones
      .filter((z) => z.offsetMinutes >= 0)
      .sort((a, b) => b.offsetMinutes - a.offsetMinutes); // зворотній порядок

    const negatives = zones
      .filter((z) => z.offsetMinutes < 0)
      .sort((a, b) => {
        const absA = Math.abs(a.offsetMinutes);
        const absB = Math.abs(b.offsetMinutes);

        // спочатку цілі години (мінут = 0)
        const isHalfA = absA % 60 !== 0;
        const isHalfB = absB % 60 !== 0;

        if (Math.floor(absA / 60) === Math.floor(absB / 60)) {
          // у межах однієї години: спершу ціла, потім дробова
          if (!isHalfA && isHalfB) return -1;
          if (isHalfA && !isHalfB) return 1;
          return absA - absB;
        }

        // інакше — за зростанням годин
        return absA - absB;
      });

    return [...positives, ...negatives];
  }
}
