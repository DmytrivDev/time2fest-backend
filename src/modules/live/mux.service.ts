// src/modules/live/mux.service.ts
import { Injectable } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class MuxService {
  private get auth() {
    return {
      username: process.env.MUX_TOKEN_ID!,
      password: process.env.MUX_TOKEN_SECRET!,
    };
  }

  async createWebrtcLive() {
    const res = await axios.post(
      "https://api.mux.com/video/v1/webrtc-lives",
      {
        playback_policy: "public",
        new_asset_settings: {
          playback_policy: "public",
        },
      },
      { auth: this.auth }
    );

    return {
      liveId: res.data.data.id,                 // ✅ webrtc_live_id
      playbackId: res.data.data.playback_ids[0].id,
    };
  }

  async createWebrtcIngest(webrtcLiveId: string) {
    const res = await axios.post(
      "https://api.mux.com/video/v1/webrtc-ingests",
      {
        webrtc_live_id: webrtcLiveId,            // 🔥 ВАЖЛИВО
      },
      { auth: this.auth }
    );

    return {
      ingestUrl: res.data.data.ingest_url,
      token: res.data.data.token,
    };
  }
}
