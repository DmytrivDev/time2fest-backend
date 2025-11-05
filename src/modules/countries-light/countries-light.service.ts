import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class CountriesLightService {
  constructor(private readonly strapi: StrapiService) {}

  async getLightCountries(
    pairs: { slug: string; zone: string }[],
    locale = "en"
  ) {
    try {
      const results = await Promise.all(
        pairs.map(async ({ slug, zone }) => {
          // 1️⃣ Нормалізуємо часову зону — прибираємо "UTC"
          const cleanZone = zone.replace(/^UTC\s*/i, "").trim();

          const params = new URLSearchParams();
          params.set("filters[slug][$eq]", slug.toLowerCase());
          params.set("populate[TimezoneDetail]", "true");
          params.set("pagination[pageSize]", "1");
          params.set("fields[0]", "slug");
          params.set("fields[1]", "CountryName");
          params.set("fields[2]", "CountryCode");

          const url = `countries?${params.toString()}`;
          console.log(`🌍 [Light] Fetching "${slug}" → ${url}`);

          const resp: any = await this.strapi.get(url, undefined, true, true);
          const data = resp?.data?.[0] ?? resp?.[0] ?? null;

          if (!data) {
            console.warn(`⚠️ Country not found for slug: ${slug}`);
            return null;
          }

          const attrs = data.attributes ?? data;
          const tzDetail = Array.isArray(attrs.TimezoneDetail)
            ? attrs.TimezoneDetail
            : [];

          // 2️⃣ Шукаємо елемент, де Zone === cleanZone (наприклад, "-3")
          const match = tzDetail.find(
            (item: any) => String(item?.Zone ?? "").trim() === cleanZone
          );

          // 3️⃣ Якщо знайдено — беремо Ambassador та VebCamera (null = false)
          const hasAmbassador = match ? Boolean(match.Ambassador) : false;
          const hasCamera = match ? Boolean(match.VebCamera) : false;

          console.log(
            `✅ ${slug}: Zone=${cleanZone} → match=${
              !!match
            }, Ambassador=${hasAmbassador}, Camera=${hasCamera}`
          );

          return {
            slug,
            country: attrs.CountryName ?? slug,
            code: attrs.CountryCode ?? "",
            zone: cleanZone,
            hasAmbassador,
            hasCamera,
          };
        })
      );

      return results.filter(Boolean);
    } catch (err) {
      console.error("🔥 CountriesLightService.getLightCountries error:", err);
      throw new InternalServerErrorException("Failed to load light countries");
    }
  }
}
