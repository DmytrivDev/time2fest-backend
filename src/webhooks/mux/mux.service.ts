import { Injectable } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class MuxWebhookService {
  constructor(private readonly strapi: StrapiService) {}

  async handleEvent(event: any) {
    switch (event.type) {
      case "video.asset.created":
        return this.onAssetCreated(event);

      case "video.live_stream.connected":
        return this.onLiveConnected(event);

      case "video.live_stream.idle":
        return this.onLiveEnded(event);

      case "video.asset.live_stream_completed":
        return this.onAssetCompleted(event);

      default:
        return;
    }
  }

  /**
   * ▶ asset створено — отримуємо playback_id
   */
  private async onAssetCreated(event: any) {
    const liveStreamId = event.data?.live_stream_id;
    const assetId = event.data?.id;
    const playbackId = event.data?.playback_ids?.[0]?.id;

    if (!liveStreamId || !playbackId) return;

    await this.updateLiveStream(liveStreamId, {
      active_asset_id: assetId,
      mux_playback_id: playbackId,
    });
  }

  /**
   * ▶ live реально стартував
   */
  private async onLiveConnected(event: any) {
    const liveStreamId = event.data?.id;
    const assetId = event.data?.active_asset_id;

    if (!liveStreamId) return;

    await this.updateLiveStream(liveStreamId, {
      trstatus: "process",
      active_asset_id: assetId,
    });
  }

  /**
   * ⏹ live завершився
   */
  private async onLiveEnded(event: any) {
    const liveStreamId = event.data?.id;
    if (!liveStreamId) return;

    await this.updateLiveStream(liveStreamId, {
      trstatus: "ended",
    });
  }

  /**
   * 🎬 фінальний asset готовий
   */
  private async onAssetCompleted(event: any) {
    const liveStreamId = event.data?.live_stream_id;
    const playbackId = event.data?.playback_ids?.[0]?.id;

    if (!liveStreamId || !playbackId) return;

    await this.updateLiveStream(liveStreamId, {
      mux_playback_id: playbackId,
    });
  }

  /**
   * 🔁 update LiveStream у Strapi по mux_live_stream_id
   */
  private async updateLiveStream(
    muxLiveStreamId: string,
    data: Record<string, any>
  ) {
    // 1️⃣ знайти стрім
    const result = await this.strapi.get<any[]>(
      `/live-streams?filters[mux_live_stream_id][$eq]=${muxLiveStreamId}`,
      undefined,
      false
    );

    const streams = Array.isArray(result) ? result : [];
    const stream = streams[0];

    if (!stream?.id) return;

    // 2️⃣ оновити
    await this.strapi.post(`/live-streams/${stream.id}`, {
      data,
    });

    // 3️⃣ очистити кеш (опціонально)
    this.strapi.clearCache("live-streams");
  }
}
