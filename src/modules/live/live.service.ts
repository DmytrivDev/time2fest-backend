// src/modules/live/live.service.ts

import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";
import { normalizeLiveStream } from "./live.normalize"; // 👈 ВАЖЛИВО

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
        const fixedZone = timeZoneCode.replace(" ", "+");
        qs.set("filters[time_zone][code][$eq]", fixedZone);
      }

      const url = `live-streams?${qs.toString()}`;
      console.log("🎥 Fetch live streams:", url);

      const resp: any = await this.strapi.get(url, undefined, true, true);

      const data = resp?.data?.data ?? resp?.data ?? resp ?? [];

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
