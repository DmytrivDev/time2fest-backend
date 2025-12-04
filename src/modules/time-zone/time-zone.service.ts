import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";
import { AxiosError } from "axios";

@Injectable()
export class TimeZoneService {
  constructor(private readonly strapi: StrapiService) {}

  async getCountriesByTimeZone(code: string, locale = "uk") {
    try {
      const qs = new URLSearchParams();
      qs.set("filters[code][$eq]", code);
      qs.set("locale", locale);

      // --- Популяції, дозволені Strapi через time-zones ---
      qs.set("populate[countries]", "true"); // витягнути всі країни
      qs.set("populate[countries][populate][Background]", "true");
      qs.set("populate[countries][populate][TimezoneDetail]", "true");
      qs.set("populate[countries][populate][time_zones]", "true");

      // ⚠ ambassadors витягуються тільки як "data", вкладений populate Strapi НЕ допускає
      qs.set("populate[countries][populate][ambassadors]", "true");

      const url = `/time-zones?${qs.toString()}`;
      console.log("🧭 Fetching from Strapi:", url);

      const resp: any = await this.strapi.get(url);
      if (!resp) return [];

      const zones = resp?.data?.data ?? resp?.data ?? resp ?? [];
      if (!zones?.length) return [];

      const zone = zones[0];
      const attrs = zone.attributes ?? zone;

      const countries = attrs.countries?.data ?? attrs.countries ?? [];

      return countries.map((item: any) => {
        const a = item.attributes ?? item;

        // --- Background (як у CountriesService) ---
        const bg = a.Background?.data?.attributes ?? a.Background ?? null;

        const backgroundUrl = bg?.url ?? null;

        // --- TimezoneDetail ---
        const timezoneDetail = a.TimezoneDetail?.data ?? a.TimezoneDetail ?? [];

        // --- Амбасадори (плоскі дані, без вкладених populate) ---
        const ambassadors = Array.isArray(a.ambassadors)
          ? a.ambassadors.map((am: any) => {
              const amb = am.attributes ?? am;
              return {
                id: amb.id ?? am.id,
                slug: amb.slug ?? null,
                name: amb.Name ?? null,
                description: amb.Description ?? null,
                photo: amb.Photo ?? null, // Strapi не видає data.attributes.url на цьому рівні
                video: amb.Video ?? null,
                socialLinks: amb.SocialLinks ?? [],
                time_zone: amb.time_zone ?? null,
              };
            })
          : [];

        return {
          id: item.id,
          CountryName: a.CountryName ?? "",
          CountryCode: a.CountryCode ?? "",
          CountryDesc: a.CountryDesc ?? "",
          ShortDesc: a.ShortDesc ?? "",
          slug: a.slug ?? "",
          locale: a.locale ?? locale,

          Background: backgroundUrl,
          TimezoneDetail: timezoneDetail,
          ambassadors,

          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
        };
      });
    } catch (err) {
      const error = err as AxiosError;
      console.error(
        "🔥 TimeZoneService error:",
        error.response?.data || error.message
      );
      throw new InternalServerErrorException("Failed to load time zone data");
    }
  }
}
