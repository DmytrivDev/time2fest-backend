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

    if (!Array.isArray(res) || !res.length) return null;

    const live = res[0];

    return {
      id: live.id,
      slug: live.slug,
      trstatus: live.trstatus,
      muxWebrtcLiveId: live.muxWebrtcLiveId,
      playbackId: live.playbackId,
    };
  }

  async updateStatus(
    id: number,
    trstatus: "prestart" | "process" | "end"
  ) {
    await this.strapi.post(
      `/live-streams/${id}`,
      { data: { trstatus } }
    );

    this.strapi.clearCache();
  }

  async saveMuxData(
    id: number,
    muxWebrtcLiveId: string,
    playbackId: string
  ) {
    await this.strapi.post(
      `/live-streams/${id}`,
      {
        data: {
          muxWebrtcLiveId,
          playbackId,
        },
      }
    );

    this.strapi.clearCache();
  }
}
