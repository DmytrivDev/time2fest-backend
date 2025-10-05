import { Injectable } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class AmbassadorsListService {
  constructor(private readonly strapi: StrapiService) {}

  // Усі амбасадори
  async getAll(locale = "uk", timeZone?: string, countryCode?: string) {
    const qs = new URLSearchParams();
    qs.set("locale", locale);
    qs.set("populate", "*");
    qs.set("pagination[pageSize]", "100");

    if (timeZone) qs.set("filters[time_zone][code][$eq]", timeZone);
    if (countryCode)
      qs.set("filters[country][CountryCode][$eq]", countryCode.toUpperCase());

    const resp: any = await this.strapi.get(
      `/ambassadors-lists?${qs.toString()}`
    );
    const data = resp?.data ?? resp;

    if (!Array.isArray(data)) return [];

    return data.map((item: any) => {
      const attrs = item.attributes ?? item;

      const photo =
        attrs.Photo?.data?.attributes?.url ?? attrs.Photo?.url ?? null;

      const country = attrs.country?.data?.attributes ?? attrs.country ?? null;

      const tz = attrs.time_zone?.data?.attributes ?? attrs.time_zone ?? null;

      return {
        id: item.id,
        name: attrs.Name ?? "",
        description: attrs.Description ?? "",
        country: {
          name: country?.CountryName ?? "",
          code: country?.CountryCode ?? "",
        },
        timeZone: tz?.code ?? "", // ✅ ← Ось тут ключове
        photo,
        createdAt: attrs.createdAt,
        updatedAt: attrs.updatedAt,
        locale: attrs.locale,
      };
    });
  }

  // Один амбасадор
  async getById(id: number, locale = "uk") {
    const qs = new URLSearchParams();
    qs.set("locale", locale);
    qs.set("populate", "*");

    const resp: any = await this.strapi.get(
      `/ambassadors-lists/${id}?${qs.toString()}`
    );
    const data = resp?.data ?? resp;
    if (!data) return null;

    const attrs = data.attributes ?? data;

    const photo =
      attrs.Photo?.data?.attributes?.url ?? attrs.Photo?.url ?? null;

    const country = attrs.country?.data?.attributes ?? attrs.country ?? null;

    const tz = attrs.time_zone?.data?.attributes ?? attrs.time_zone ?? null;

    return {
      id: data.id,
      name: attrs.Name ?? "",
      description: attrs.Description ?? "",
      country: {
        name: country?.CountryName ?? "",
        code: country?.CountryCode ?? "",
      },
      timeZone: tz?.code ?? "", // ✅ ← і тут теж
      photo,
      createdAt: attrs.createdAt,
      updatedAt: attrs.updatedAt,
      locale: attrs.locale,
    };
  }
}
