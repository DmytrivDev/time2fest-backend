// src/modules/live/live.repository.ts
import { Injectable } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class LiveRepository {
  constructor(private readonly strapi: StrapiService) {}

  async findBySlug(slug: string) {
    const res = await this.strapi.get<any[]>(
      `/live-streams?filters[slug][$eq]=${slug}`,
      undefined,
      true
    );

    return Array.isArray(res) && res.length ? res[0] : null;
  }

  async updateStatus(id: number, trstatus: "prestart" | "process" | "end") {
    await this.strapi.post(
      `/live-streams/${id}`,
      { data: { trstatus } }
    );

    // 🔥 критично
    this.strapi.clearCache();
  }
}
