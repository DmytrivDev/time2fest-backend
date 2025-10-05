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

    if (timeZone) qs.set("filters[timeZone][$eq]", timeZone);
    if (countryCode)
      qs.set("filters[country][CountryCode][$eq]", countryCode.toUpperCase());

    const resp: any = await this.strapi.get(
      `/ambassadors-lists?${qs.toString()}`
    );
    const data = resp?.data ?? resp;

    if (!Array.isArray(data)) return [];

    return data.map((item: any) => {
      const country = item.country ?? null;

      return {
        id: item.id,
        name: item.Name ?? "",
        description: item.Description ?? "",
        country: {
          name: country?.CountryName ?? "",
          code: country?.CountryCode ?? "",
        },
        timeZone: item.timeZone ?? "",
        photo: item.photo?.url ?? null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        locale: item.locale,
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

    const country = data.country ?? null;

    return {
      id: data.id,
      name: data.Name ?? "",
      description: data.Description ?? "",
      country: {
        name: country?.CountryName ?? "",
        code: country?.CountryCode ?? "",
      },
      timeZone: data.timeZone ?? "",
      photo: data.photo?.url ?? null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      locale: data.locale,
    };
  }
}
