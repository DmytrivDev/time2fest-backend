import { Injectable } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class AmbassadorsListService {
  constructor(private readonly strapi: StrapiService) {}

  // ---- Усі амбасадори ----
  async getAll(
    locale = "uk",
    timeZone?: string,
    countryCode?: string,
    ids?: number[],
    full = false
  ) {
    const qs = new URLSearchParams();
    qs.set("locale", locale);
    qs.set("pagination[pageSize]", "100");

    // ---- Повнота даних ----
    // навіть при full=false залишаємо populate="*",
    // бо Strapi може не повернути вкладені поля без цього
    qs.set("populate", "*");

    // ---- Фільтри ----
    if (timeZone) qs.set("filters[time_zone][code][$eq]", timeZone);
    if (countryCode)
      qs.set("filters[country][CountryCode][$eq]", countryCode.toUpperCase());
    if (ids && ids.length > 0)
      ids.forEach((id, i) => qs.set(`filters[id][$in][${i}]`, String(id)));

    // ---- Запит до Strapi ----
    const resp: any = await this.strapi.get(
      `/ambassadors-lists?${qs.toString()}`
    );
    const data = resp?.data ?? resp;

    if (!Array.isArray(data)) return [];

    // ---- Формування масиву ----
    return data.map((item: any) => {
      const attrs = item.attributes ?? item;

      const photo =
        attrs.Photo?.data?.attributes?.url ?? attrs.Photo?.url ?? null;

      const country = attrs.country?.data?.attributes ?? attrs.country ?? null;
      const tz = attrs.time_zone?.data?.attributes ?? attrs.time_zone ?? null;

      // --- Базові поля ---
      const base: any = {
        id: item.id,
        slug: item.slug,
        name: attrs.Name ?? "",
        description: attrs.Description ?? "",
        country: {
          name: country?.CountryName ?? "",
          code: country?.CountryCode ?? "",
        },
        timeZone: tz?.code ?? "",
        photo,
        createdAt: attrs.createdAt,
        updatedAt: attrs.updatedAt,
        locale: attrs.locale,
      };

      // --- Якщо full=true → додаємо всі додаткові поля ---
      if (full) {
        base.video =
          attrs.Video?.data?.attributes?.url ?? attrs.Video?.url ?? null;
        base.languages = attrs.Languages ?? "";
        base.gender = attrs.Gender ?? "";
        base.socialLinks = Array.isArray(attrs.SocialLinks)
          ? attrs.SocialLinks.map((link: any) => ({
              name: link?.Name ?? "",
              link: link?.Link ?? "",
            }))
          : [];
        base.fullDescription = attrs.FullDescription ?? "";
      }

      return base;
    });
  }

  // ---- Один амбасадор ----
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
      slug: data.slug,
      name: attrs.Name ?? "",
      description: attrs.Description ?? "",
      fullDescription: attrs.FullDescription ?? "",
      country: {
        name: country?.CountryName ?? "",
        code: country?.CountryCode ?? "",
      },
      timeZone: tz?.code ?? "",
      photo,
      video: attrs.Video?.data?.attributes?.url ?? attrs.Video?.url ?? null,
      languages: attrs.Languages ?? "",
      gender: attrs.Gender ?? "",
      socialLinks: Array.isArray(attrs.SocialLinks)
        ? attrs.SocialLinks.map((link: any) => ({
            name: link?.Name ?? "",
            link: link?.Link ?? "",
          }))
        : [],
      createdAt: attrs.createdAt,
      updatedAt: attrs.updatedAt,
      locale: attrs.locale,
    };
  }
}
