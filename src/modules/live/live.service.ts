// src/modules/live/live.service.ts

import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";
import { normalizeLiveStream } from "./live.normalize";
import { mux } from "../../services/mux.client";

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
        qs.set("filters[time_zone][code][$eq]", timeZoneCode.replace(" ", "+"));
      }

      const url = `live-streams?${qs.toString()}`;
      console.log("🎥 Fetch live streams:", url);

      const resp: any = await this.strapi.get(url, undefined, true, true);
      const rawItems = resp?.data?.data ?? [];

      const items = [];

      for (const item of rawItems) {
        const attrs = item.attributes ?? item;

        // 🔹 якщо live_playback_id ще не збережений
        if (!attrs.live_playback_id && attrs.mux_live_stream_id) {
          try {
            const live = await mux.video.liveStreams.retrieve(
              attrs.mux_live_stream_id
            );

            const playbackId = live.playback_ids?.[0]?.id;

            if (playbackId) {
              console.log(
                "🎯 Found live playback id:",
                playbackId,
                "for",
                attrs.mux_live_stream_id
              );

              // ✅ ЗАПИС У STRAPI (2 аргументи!)
              await this.strapi.put(`live-streams/${item.id}`, {
                data: {
                  live_playback_id: playbackId,
                },
              });

              // щоб одразу було доступно в normalize
              attrs.live_playback_id = playbackId;
            }
          } catch (e) {
            console.warn(
              "⚠️ Failed to fetch live playback id for",
              attrs.mux_live_stream_id
            );
          }
        }

        items.push(normalizeLiveStream(item));
      }

      return { items };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException("Failed to load live streams");
    }
  }
}
