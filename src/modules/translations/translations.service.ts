// src/modules/translations/translations.service.ts

import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";
import { AxiosError } from "axios";
import { normalizeTranslation } from "./translations.normalize";

@Injectable()
export class TranslationsService {
  constructor(private readonly strapi: StrapiService) {}

  async getAll(countrySlug?: string, timeZoneCode?: string) {
    try {
      const qs = new URLSearchParams();
      qs.set("populate", "*");
      qs.set("pagination[pageSize]", "300");

      if (countrySlug) {
        qs.set("filters[country][slug][$eq]", countrySlug.toLowerCase());
      }

      if (timeZoneCode) {
        // 🔴 КЛЮЧОВИЙ ФІКС
        const fixedZone = timeZoneCode.replace(" ", "+");

        qs.set("filters[time_zone][code][$eq]", fixedZone);
      }

      const url = `translations?${qs.toString()}`;
      console.log("🎥 Fetch translations:", url);

      const resp: any = await this.strapi.get(url, undefined, true);

      const data = resp?.data?.data ?? resp?.data ?? resp ?? [];

      return {
        items: Array.isArray(data) ? data.map(normalizeTranslation) : [],
      };
    } catch (err) {
      throw new InternalServerErrorException("Failed to load translations");
    }
  }
}
