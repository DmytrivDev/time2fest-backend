import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";
import { AxiosError } from "axios";

@Injectable()
export class AmbassadorsListService {
  constructor(private readonly strapi: StrapiService) {}

  async getAll(
    locale = "uk",
    timeZone?: string,
    countryCode?: string,
    ids?: number[],
    full = false,
    rand = false,
    count = 1,
    exclude: number[] = [],
    page?: string,
    limit?: string
  ) {
    try {
      const qs = new URLSearchParams();
      qs.set("locale", locale);
      qs.set("populate", "*");

      // --- Пагінація ---
      if (page && limit) {
        qs.set("pagination[page]", page);
        qs.set("pagination[pageSize]", limit);
      } else {
        qs.set("pagination[pageSize]", "300");
      }

      // --- Фільтри ---
      if (timeZone) qs.set("filters[time_zone][code][$eq]", timeZone);
      if (countryCode)
        qs.set("filters[country][CountryCode][$eq]", countryCode.toUpperCase());
      if (ids && ids.length > 0)
        ids.forEach((id, i) => qs.set(`filters[id][$in][${i}]`, String(id)));
      if (exclude && exclude.length > 0)
        exclude.forEach((id, i) =>
          qs.set(`filters[id][$notIn][${i}]`, String(id))
        );

      // --- Запит ---
      const url = `/ambassadors-lists?${qs.toString()}`;
      const resp: any = await this.strapi.get(url, undefined, true, true);

      const data = resp?.data?.data ?? resp?.data ?? resp ?? [];
      const meta = resp?.meta ??
        resp?.data?.meta ??
        resp?.data?.meta?.pagination ?? {
          pagination: { page: 1, pageSize: 300, pageCount: 1, total: 0 },
        };

      if (!Array.isArray(data))
        return { items: [], meta: { pagination: meta.pagination ?? meta } };

      // --- Формування масиву ---
      let result = data.map((item: any) => {
        const attrs = item.attributes ?? item;
        const photo =
          attrs.Photo?.data?.attributes?.url ?? attrs.Photo?.url ?? null;
        const country =
          attrs.country?.data?.attributes ?? attrs.country ?? null;
        const tz = attrs.time_zone?.data?.attributes ?? attrs.time_zone ?? null;

        const base: any = {
          id: item.id,
          slug: item.slug,
          name: attrs.Name ?? "",
          description: attrs.Description ?? "",
          country: {
            name: country?.CountryName ?? "",
            sec: country?.CountrySec ?? "",
            code: country?.CountryCode ?? "",
          },
          timeZone: tz?.code ?? "",
          photo,
          createdAt: attrs.createdAt,
          updatedAt: attrs.updatedAt,
          locale: attrs.locale,
        };

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

      // --- Виключення ID ---
      if (exclude.length > 0)
        result = result.filter((item) => !exclude.includes(item.id));

      // --- Рандомізація ---
      if (rand && result.length > 0) {
        const shuffled = [...result].sort(() => Math.random() - 0.5);
        result = shuffled.slice(0, Math.min(count, result.length));
      }

      return {
        items: result,
        meta: { pagination: meta.pagination ?? meta },
      };
    } catch (err) {
      const error = err as AxiosError;
      console.error(
        "🔥 AmbassadorsListService error:",
        error.response?.data || error.message
      );
      throw new InternalServerErrorException("Failed to load ambassadors");
    }
  }

  // ---- Один амбасадор ----
  async getById(id: number, locale = "uk") {
    try {
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
          sec: country?.CountrySec ?? "",
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
    } catch (err) {
      const error = err as AxiosError;
      console.error(
        "🔥 AmbassadorsListService.getById error:",
        error.response?.data || error.message
      );
      throw new InternalServerErrorException("Failed to load ambassador");
    }
  }
}
