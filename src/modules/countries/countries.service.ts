import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";
import { AxiosError } from "axios";

@Injectable()
export class CountriesService {
  constructor(private readonly strapi: StrapiService) {}

  async getCountry(code?: string, slug?: string, locale = "uk") {
    try {
      const params = new URLSearchParams();
      params.set("locale", locale);

      // --- ❗ Важливо: додаємо вкладений populate як окремі поля ---
      params.set("populate[ambassadors][populate][0]", "Photo");
      params.set("populate[ambassadors][populate][1]", "Video");
      params.set("populate[ambassadors][populate][2]", "SocialLinks");
      params.set("populate[ambassadors][populate][2]", "time_zone");
      params.set("populate[time_zones]", "true");
      params.set("populate[TimezoneDetail]", "true");
      params.set("populate[Background]", "true");

      // --- Фільтри ---
      if (code) params.set("filters[CountryCode][$eq]", code.toUpperCase());
      if (slug) params.set("filters[slug][$eq]", slug.toLowerCase());

      const url = `/countries?${params.toString()}`;
      console.log("🌍 Fetching country from Strapi:", url);

      const resp: any = await this.strapi.get(url);
      const data = resp?.data ?? resp;
      if (!Array.isArray(data) || !data.length) return [];

      return data.map((item: any) => {
        const attrs = item.attributes ?? item;

        // 🖼️ Фонове зображення
        const bg =
          attrs.Background?.data?.attributes ?? attrs.Background ?? null;
        const backgroundUrl = bg?.url ?? null;

        // 🕺 Амбасадори з вкладеними медіа
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
                photo:
                  amb.Photo?.data?.attributes?.url ?? amb.Photo?.url ?? null,
                video:
                  amb.Video?.data?.attributes?.url ?? amb.Video?.url ?? null,
                time_zone:
                  amb.time_zone?.data?.attributes?.code ?? amb.time_zone?.code ?? null,
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

        return {
          id: item.id,
          CountryName: attrs.CountryName ?? "",
          CountryCode: attrs.CountryCode ?? "",
          CountryDesc: attrs.CountryDesc ?? "",
          ShortDesc: attrs.ShortDesc ?? "",
          slug: attrs.slug ?? "",
          locale: attrs.locale ?? locale,
          Background: backgroundUrl,
          time_zones: attrs.time_zones ?? [],
          TimezoneDetail: attrs.TimezoneDetail ?? [],
          ambassadors,
          createdAt: attrs.createdAt,
          updatedAt: attrs.updatedAt,
        };
      });
    } catch (err) {
      const error = err as AxiosError;
      console.error(
        "🔥 CountriesService error:",
        error.response?.data || error.message
      );
      throw new InternalServerErrorException("Failed to load country data");
    }
  }
}
