// src/modules/live/live.service.ts

import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";
import { normalizeLiveStream } from "./live.normalize";

@Injectable()
export class LiveService {
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
        const zones = timeZoneCode
          .split(",")
          .map((z) => z.trim().replace(" ", "+"))
          .filter(Boolean);

        zones.forEach((zone, index) => {
          qs.set(`filters[$or][${index}][time_zone][code][$eq]`, zone);
        });
      }

      const url = `live-streams?${qs.toString()}`;
      console.log("🎥 Fetch LIVE streams (NO CACHE):", url);

      // 🚨 LIVE = NO CACHE
      const resp: any = await this.strapi.getNoCache(url);

      const data = resp?.data ?? resp ?? [];

      return {
        items: Array.isArray(data)
          ? data.map((item) => normalizeLiveStream(item))
          : [],
      };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException("Failed to load live streams");
    }
  }
}
