import { Injectable } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class MuxWebhookService {
  constructor(private readonly strapi: StrapiService) {}

  async handleEvent(event: any) {
    console.log("🔔 MUX WEBHOOK:", event.type);

    switch (event.type) {
      case "video.live_stream.connected":
        return this.onLiveConnected(event);

      case "video.live_stream.idle":
        return this.onLiveEnded(event);

      case "video.asset.ready":
        return this.onAssetReady(event);

      default:
        return;
    }
  }

  /**
   * ▶ Live реально стартував
   * trstatus = process
   */
  private async onLiveConnected(event: any) {
    const muxLiveStreamId = event.data?.id;
    if (!muxLiveStreamId) return;

    await this.updateLiveStream(muxLiveStreamId, {
      trstatus: "process",
    });
  }

  /**
   * ⏹ Live завершився
   * trstatus = end
   */
  private async onLiveEnded(event: any) {
    const muxLiveStreamId = event.data?.id;
    if (!muxLiveStreamId) return;

    await this.updateLiveStream(muxLiveStreamId, {
      trstatus: "end",
    });
  }

  /**
   * 🎬 Запис готовий — ТУТ Є playback_id
   */
  private async onAssetReady(event: any) {
    const muxLiveStreamId = event.data?.live_stream_id;
    const playbackId = event.data?.playback_ids?.[0]?.id;

    if (!muxLiveStreamId || !playbackId) return;

    await this.updateLiveStream(muxLiveStreamId, {
      mux_playback_id: playbackId,
    });
  }

  /**
   * 🔁 ОНОВЛЕННЯ STRAPI ПО mux_live_stream_id
   */
  private async updateLiveStream(
    muxLiveStreamId: string,
    data: Record<string, any>
  ) {
    // 1️⃣ Знаходимо live-stream
    const result = await this.strapi.get<any[]>(
      `/live-streams?filters[mux_live_stream_id][$eq]=${muxLiveStreamId}`,
      undefined,
      false
    );

    const stream = Array.isArray(result) ? result[0] : null;

    if (!stream?.documentId) {
      console.warn(
        `⚠ LiveStream not found for mux_live_stream_id=${muxLiveStreamId}`
      );
      return;
    }

    // 2️⃣ Оновлюємо через documentId (Strapi v4)
    await this.strapi.put(`/live-streams/${stream.documentId}`, {
      data,
    });

    // 3️⃣ Чистимо кеш
    this.strapi.clearCache("live-streams");
  }
}
