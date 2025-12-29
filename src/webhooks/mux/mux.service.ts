// src/modules/mux/mux-webhook.service.ts

import { Injectable } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class MuxWebhookService {
  constructor(private readonly strapi: StrapiService) {}

  async handleEvent(event: any) {
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

  /** ▶ LIVE CONNECTED */
  private async onLiveConnected(event: any) {
    const muxLiveStreamId = event.data?.id;
    if (!muxLiveStreamId) return;

    await this.updateLiveStream(muxLiveStreamId, {
      trstatus: "process",
    });
  }

  /** ▶ LIVE ACTIVE (live playback) */
  private async onLiveActive(event: any) {
    const muxLiveStreamId = event.data?.id;
    if (!muxLiveStreamId) return;

    const updateData: Record<string, any> = {};

    const livePlaybackId = event.data?.playback_ids?.[0]?.id;
    if (livePlaybackId) {
      updateData.live_playback_id = livePlaybackId;
    }

    const activeAssetId = event.data?.active_asset_id;
    if (activeAssetId) {
      updateData.active_asset_id = activeAssetId;
    }

    if (!Object.keys(updateData).length) return;

    await this.updateLiveStream(muxLiveStreamId, updateData);
  }

  /** ⏹ LIVE DISCONNECTED */
  private async onLiveDisconnected(event: any) {
    const muxLiveStreamId = event.data?.id;
    if (!muxLiveStreamId) return;

    await this.updateLiveStream(muxLiveStreamId, {
      trstatus: "end",
    });
  }

  /** 🎞 ASSET CREATED (fallback asset) */
  private async onAssetCreated(event: any) {
    const muxLiveStreamId = event.data?.live_stream_id;
    const assetId = event.data?.id;

    if (!muxLiveStreamId || !assetId) return;

    await this.updateLiveStream(muxLiveStreamId, {
      active_asset_id: assetId,
    });
  }

  /** 🎬 ASSET READY (VOD playback) */
  private async onAssetReady(event: any) {
    const muxLiveStreamId = event.data?.live_stream_id;
    const vodPlaybackId = event.data?.playback_ids?.[0]?.id;

    if (!muxLiveStreamId || !vodPlaybackId) return;

    await this.updateLiveStream(muxLiveStreamId, {
      mux_playback_id: vodPlaybackId,
    });
  }

  // =========================
  // INTERNAL
  // =========================

  private async updateLiveStream(
    muxLiveStreamId: string,
    data: Record<string, any>
  ) {
    // 🚨 LIVE = NO CACHE
    const result = await this.strapi.getNoCache<any[]>(
      `/live-streams?filters[mux_live_stream_id][$eq]=${muxLiveStreamId}`
    );

    const stream = Array.isArray(result) ? result[0] : null;
    if (!stream?.documentId) return;

    await this.strapi.put(`/live-streams/${stream.documentId}`, { data });
  }
}
