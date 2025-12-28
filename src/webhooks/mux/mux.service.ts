import { Injectable } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class MuxWebhookService {
  constructor(private readonly strapi: StrapiService) {}

  async handleEvent(event: any) {
    console.log("\n==============================");
    console.log("🔔 MUX WEBHOOK RECEIVED");
    console.log("➡ TYPE:", event.type);
    console.log("➡ DATA:", JSON.stringify(event.data, null, 2));
    console.log("==============================\n");

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
        console.log("⚠️ Unhandled MUX event:", event.type);
        return;
    }
  }

  /** ▶ LIVE CONNECTED */
  private async onLiveConnected(event: any) {
    const id = event.data?.id;

    console.log("▶ LIVE CONNECTED");
    console.log("  mux_live_stream_id:", id);

    if (!id) return;

    await this.updateLiveStream(id, {
      trstatus: "process",
    });
  }

  /** ▶ LIVE ACTIVE */
  private async onLiveActive(event: any) {
    const id = event.data?.id;
    const assetId = event.data?.active_asset_id;
    const playbackIds = event.data?.playback_ids;

    console.log("▶ LIVE ACTIVE");
    console.log("  mux_live_stream_id:", id);
    console.log("  active_asset_id:", assetId);
    console.log("  playback_ids:", playbackIds);

    if (!id) return;

    const updateData: any = {};

    if (assetId) {
      updateData.active_asset_id = assetId;
    }

    // 🔥 ОЦЕ НАЙВАЖЛИВІШЕ МІСЦЕ
    if (Array.isArray(playbackIds) && playbackIds[0]?.id) {
      updateData.live_playback_id = playbackIds[0].id;

      console.log(
        "🎯 FOUND LIVE PLAYBACK ID:",
        playbackIds[0].id
      );
    } else {
      console.log("⚠️ NO playback_ids on live_stream.active");
    }

    if (Object.keys(updateData).length === 0) return;

    await this.updateLiveStream(id, updateData);
  }

  /** ⏹ LIVE DISCONNECTED */
  private async onLiveDisconnected(event: any) {
    const id = event.data?.id;

    console.log("⏹ LIVE DISCONNECTED");
    console.log("  mux_live_stream_id:", id);

    if (!id) return;

    await this.updateLiveStream(id, {
      trstatus: "end",
    });
  }

  /** 🎞 ASSET CREATED */
  private async onAssetCreated(event: any) {
    const liveId = event.data?.live_stream_id;
    const assetId = event.data?.id;

    console.log("🎞 ASSET CREATED");
    console.log("  live_stream_id:", liveId);
    console.log("  asset_id:", assetId);

    if (!liveId || !assetId) return;

    await this.updateLiveStream(liveId, {
      active_asset_id: assetId,
    });
  }

  /** 🎬 ASSET READY (VOD playback) */
  private async onAssetReady(event: any) {
    const liveId = event.data?.live_stream_id;
    const playbackIds = event.data?.playback_ids;

    console.log("🎬 ASSET READY");
    console.log("  live_stream_id:", liveId);
    console.log("  playback_ids:", playbackIds);

    if (!liveId) return;

    const vodPlaybackId = playbackIds?.[0]?.id;
    if (!vodPlaybackId) {
      console.log("⚠️ NO playback_id in asset.ready");
      return;
    }

    console.log("🎯 FOUND VOD PLAYBACK ID:", vodPlaybackId);

    await this.updateLiveStream(liveId, {
      mux_playback_id: vodPlaybackId,
    });
  }

  /** 🔁 UPDATE STRAPI */
  private async updateLiveStream(
    muxLiveStreamId: string,
    data: Record<string, any>
  ) {
    console.log("🔁 UPDATE STRAPI");
    console.log("  mux_live_stream_id:", muxLiveStreamId);
    console.log("  data to update:", data);

    const result = await this.strapi.get<any[]>(
      `/live-streams?filters[mux_live_stream_id][$eq]=${muxLiveStreamId}`,
      undefined,
      false
    );

    console.log("  STRAPI SEARCH RESULT:", result);

    const stream = Array.isArray(result) ? result[0] : null;
    if (!stream?.documentId) {
      console.log("❌ STRAPI STREAM NOT FOUND");
      return;
    }

    console.log("✅ STRAPI STREAM FOUND:", stream.documentId);

    await this.strapi.put(`/live-streams/${stream.documentId}`, { data });
    this.strapi.clearCache("live-streams");

    console.log("✅ STRAPI UPDATED SUCCESSFULLY\n");
  }
}
