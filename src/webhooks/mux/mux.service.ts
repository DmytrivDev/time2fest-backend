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

      case "video.live_stream.active":
        return this.onLiveActive(event);

      case "video.live_stream.disconnected":
        return this.onLiveDisconnected(event);

      case "video.asset.created":
        return this.onAssetCreated(event);

      case "video.asset.ready":
        return this.onAssetReady(event);

      default:
        return;
    }
  }

  /** ▶ LIVE START */
  private async onLiveConnected(event: any) {
    const id = event.data?.id;
    if (!id) return;

    await this.updateLiveStream(id, {
      trstatus: "process",
    });
  }

  /** ▶ LIVE ACTIVE (fallback для asset id) */
  private async onLiveActive(event: any) {
    const id = event.data?.id;
    const assetId = event.data?.active_asset_id;

    if (!id || !assetId) return;

    await this.updateLiveStream(id, {
      active_asset_id: assetId,
    });
  }

  /** ⏹ LIVE END */
  private async onLiveDisconnected(event: any) {
    const id = event.data?.id;
    if (!id) return;

    await this.updateLiveStream(id, {
      trstatus: "end",
    });
  }

  /** 🎞 ASSET CREATED → беремо active_asset_id */
  private async onAssetCreated(event: any) {
    const liveId = event.data?.live_stream_id;
    const assetId = event.data?.id;

    if (!liveId || !assetId) return;

    await this.updateLiveStream(liveId, {
      active_asset_id: assetId,
    });
  }

  /** 🎬 ASSET READY → фінальний playback */
  private async onAssetReady(event: any) {
    const liveId = event.data?.live_stream_id;
    const playbackId = event.data?.playback_ids?.[0]?.id;

    if (!liveId || !playbackId) return;

    await this.updateLiveStream(liveId, {
      mux_playback_id: playbackId,
    });
  }

  /** 🔁 UPDATE STRAPI */
  private async updateLiveStream(
    muxLiveStreamId: string,
    data: Record<string, any>
  ) {
    const result = await this.strapi.get<any[]>(
      `/live-streams?filters[mux_live_stream_id][$eq]=${muxLiveStreamId}`,
      undefined,
      false
    );

    const stream = Array.isArray(result) ? result[0] : null;
    if (!stream?.documentId) return;

    await this.strapi.put(`/live-streams/${stream.documentId}`, { data });
    this.strapi.clearCache("live-streams");
  }
}
