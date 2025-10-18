import { Injectable } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class TimeZonesService {
  constructor(private readonly strapi: StrapiService) {}

  // --- Усі таймзони з країнами та перевіркою амбасадорів ---
  async getAllTimeZones(locale = "uk") {
    const qs = new URLSearchParams();
    qs.set("locale", locale);
    qs.set("populate[countries]", "true");
    qs.set("populate[ambassadors]", "true");
    qs.set("pagination[pageSize]", "100");

    const url = `/time-zones?${qs.toString()}`;
    const resp: any = await this.strapi.get(url);

    const data = resp?.data?.data ?? resp?.data ?? resp ?? [];

    if (!Array.isArray(data)) return [];

    const zones = data.map((tz: any) => {
      const attrs = tz.attributes ?? tz;

      // --- Країни ---
      const countries = Array.isArray(attrs.countries?.data)
        ? attrs.countries.data
        : attrs.countries || [];

      const countryCodes = countries
        .map((c: any) =>
          (c.attributes?.CountryCode ?? c.CountryCode ?? "")
            .toString()
            .toUpperCase()
        )
        .filter(Boolean);

      // --- Амбасадори ---
      const ambassadors =
        Array.isArray(attrs.ambassadors?.data) && attrs.ambassadors.data.length
          ? attrs.ambassadors.data
          : Array.isArray(attrs.ambassadors)
          ? attrs.ambassadors
          : [];
      const hasAmbassadors = ambassadors.length > 0;

      // --- Основні поля ---
      const code = attrs.code;
      const offset = attrs.offcet ?? attrs.offset ?? null;
      const offsetMinutes = this.parseOffset(code);

      return {
        id: tz.id,
        code,
        offset,
        offsetMinutes,
        countryCodes,
        ambassadors: hasAmbassadors, // ✅ булеве значення
      };
    });

    return this.sortTimeZones(zones);
  }

  // --- Країни для конкретної зони ---
  async getCountriesByTimeZones(code: string, locale = "uk") {
    const qs = new URLSearchParams();
    qs.set("filters[code][$eq]", code);
    qs.set("populate[countries]", "true");
    qs.set("populate[ambassadors]", "true");
    qs.set("locale", locale);

    const resp: any = await this.strapi.get(`/time-zones?${qs.toString()}`);
    return resp?.data ?? [];
  }

  // --- Парсимо "UTC±X(:Y)" -> offset у хвилинах ---
  private parseOffset(code: string): number {
    if (!code || !code.startsWith("UTC")) return 0;
    const match = code.match(/^UTC([+-])(\d{1,2})(?::(\d{2}))?$/);
    if (!match) return 0;

    const sign = match[1] === "-" ? -1 : 1;
    const hours = parseInt(match[2], 10);
    const minutes = match[3] ? parseInt(match[3], 10) : 0;

    return sign * (hours * 60 + minutes);
  }

  // --- Сортування ---
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
