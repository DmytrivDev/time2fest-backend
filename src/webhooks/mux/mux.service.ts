import { Injectable } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class MuxWebhookService {
  constructor(private readonly strapi: StrapiService) {}

  async handleEvent(event: any) {
    console.log("🔔 MUX WEBHOOK:", event.type);

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
   * ▶ Asset створено — вперше зʼявляється playback_id
   */
  private async onAssetCreated(event: any) {
    const liveStreamId = event.data?.live_stream_id;
    const assetId = event.data?.id;
    const playbackId = event.data?.playback_ids?.[0]?.id;

    if (!liveStreamId || !assetId || !playbackId) return;

    await this.updateLiveStream(liveStreamId, {
      active_asset_id: assetId,
      mux_playback_id: playbackId,
      trstatus: "process",
    });
  }

  /**
   * ▶ Live реально стартував
   */
  private async onLiveConnected(event: any) {
    const liveStreamId = event.data?.id;
    const assetId = event.data?.active_asset_id;

    if (!liveStreamId) return;

    await this.updateLiveStream(liveStreamId, {
      trstatus: "process",
      ...(assetId ? { active_asset_id: assetId } : {}),
    });
  }

  /**
   * ⏹ Live завершився
   */
  private async onLiveEnded(event: any) {
    const liveStreamId = event.data?.id;
    if (!liveStreamId) return;

    await this.updateLiveStream(liveStreamId, {
      trstatus: "ended",
    });
  }

  /**
   * 🎬 Запис готовий
   */
  private async onAssetCompleted(event: any) {
    const liveStreamId = event.data?.live_stream_id;
    const playbackId = event.data?.playback_ids?.[0]?.id;

    if (!liveStreamId || !playbackId) return;

    await this.updateLiveStream(liveStreamId, {
      mux_playback_id: playbackId,
      trstatus: "ended",
    });
  }

  /**
   * 🔁 ОНОВЛЕННЯ STRAPI ПО mux_live_stream_id
   */
  private async updateLiveStream(
    muxLiveStreamId: string,
    data: Record<string, any>
  ) {
    const streams = await this.strapi.get<any[]>(
      `/live-streams?filters[mux_live_stream_id][$eq]=${muxLiveStreamId}`,
      undefined,
      false
    );

    const stream = Array.isArray(streams) ? streams[0] : null;

    if (!stream?.id) {
      console.warn(
        `⚠ LiveStream not found for mux_live_stream_id=${muxLiveStreamId}`
      );
      return;
    }

    await this.strapi.put(`/live-streams/${stream.id}`, {
      data,
    });

    this.strapi.clearCache("live-streams");
  }
}
