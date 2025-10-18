import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";
import { AxiosError } from "axios";

@Injectable()
export class CountriesService {
  constructor(private readonly strapi: StrapiService) {}

  /**
   * Основний метод отримання країн
   * Підтримує:
   * - code / slug → конкретна країна
   * - tz → фільтр за часовою зоною
   * - page + limit → пагінація
   * - без параметрів → усі країни
   */
  async getCountry(
    code?: string,
    slug?: string,
    locale = "uk",
    page?: string,
    limit?: string,
    tz?: string
  ) {
    try {
      const params = new URLSearchParams();
      params.set("locale", locale);

      // --- Вкладені дані ---
      params.set("populate[ambassadors][populate][0]", "Photo");
      params.set("populate[ambassadors][populate][1]", "Video");
      params.set("populate[ambassadors][populate][2]", "SocialLinks");
      params.set("populate[ambassadors][populate][3]", "time_zone");
      params.set("populate[time_zones]", "true");
      params.set("populate[TimezoneDetail]", "true");
      params.set("populate[Background]", "true");
      params.set("populate[Gallery][populate][Photos]", "true");

      // --- Фільтри ---
      if (code) params.set("filters[CountryCode][$eq]", code.toUpperCase());
      if (slug) params.set("filters[slug][$eq]", slug.toLowerCase());
      if (tz) params.set("filters[time_zones][code][$eq]", tz);

      // --- Пагінація ---
      if (page && limit) {
        params.set("pagination[page]", page);
        params.set("pagination[pageSize]", limit);
      } else if (!code && !slug) {
        // якщо не конкретна країна → обмежуємо кількість
        params.set("pagination[pageSize]", "300");
      }

      const url = `/countries?${params.toString()}`;
      console.log("🌍 Fetching countries from Strapi:", url);

      const resp: any = await this.strapi.get(url);
      const data = resp?.data ?? resp;

      if (!Array.isArray(data) || !data.length) return [];

      return data.map((item: any) => this.mapCountry(item, locale));
    } catch (err) {
      const error = err as AxiosError;
      console.error(
        "🔥 CountriesService error:",
        error.response?.data || error.message
      );
      throw new InternalServerErrorException("Failed to load country data");
    }
  }

  /**
   * Мапінг структури країни
   */
  private mapCountry(item: any, locale: string) {
    const attrs = item.attributes ?? item;

    // --- Background ---
    const bg = attrs.Background?.data?.attributes ?? attrs.Background ?? null;
    const backgroundUrl = bg?.url ?? null;

    // --- Gallery ---
    const galleryUrls =
      attrs.Gallery?.Photos?.map((photo: any) => {
        const p = photo?.attributes ?? photo;
        return p.url ?? null;
      }).filter(Boolean) ?? [];

    // --- Ambassadors ---
    const ambassadors = Array.isArray(attrs.ambassadors)
      ? attrs.ambassadors.map((a: any) => {
          const amb = a.attributes ?? a;
          return {
            id: amb.id ?? a.id,
            slug: amb.slug,
            name: amb.Name ?? "",
            description: amb.Description ?? "",
            fullDescription: amb.FullDescription ?? "",
            languages: amb.Languages ?? "",
            gender: amb.Gender ?? "",
            photo: amb.Photo?.data?.attributes?.url ?? amb.Photo?.url ?? null,
            video: amb.Video?.data?.attributes?.url ?? amb.Video?.url ?? null,
            time_zone:
              amb.time_zone?.data?.attributes?.code ??
              amb.time_zone?.code ??
              null,
            socialLinks: Array.isArray(amb.SocialLinks)
              ? amb.SocialLinks.map((link: any) => ({
                  name: link?.Name ?? "",
                  link: link?.Link ?? "",
                }))
              : [],
            createdAt: amb.createdAt,
            updatedAt: amb.updatedAt,
            locale: amb.locale ?? locale,
          };
        })
      : [];

    // --- Повертаємо результат ---
    return {
      id: item.id,
      CountryName: attrs.CountryName ?? "",
      CountryCode: attrs.CountryCode ?? "",
      CountryDesc: attrs.CountryDesc ?? "",
      CountrySec: attrs.CountrySec ?? "",
      ShortDesc: attrs.ShortDesc ?? "",
      slug: attrs.slug ?? "",
      locale: attrs.locale ?? locale,
      Background: backgroundUrl,
      Gallery: galleryUrls,
      time_zones: attrs.time_zones ?? [],
      TimezoneDetail: attrs.TimezoneDetail ?? [],
      ambassadors,
      createdAt: attrs.createdAt,
      updatedAt: attrs.updatedAt,
    };
  }
}
