// src/modules/live/mux.service.ts
import { Injectable } from "@nestjs/common";
import axios from "axios";

// src/modules/live/mux.service.ts
@Injectable()
export class MuxService {
  async createWebrtcLive() {
    const res = await axios.post(
      "https://api.mux.com/video/v1/webrtc-lives",
      {
        playback_policy: ["public"],
      },
      {
        auth: {
          username: process.env.MUX_TOKEN_ID!,
          password: process.env.MUX_TOKEN_SECRET!,
        },
      }
    );

    return {
      liveId: res.data.data.id,
      playbackId: res.data.data.playback_ids[0].id,
    };
  }

  async createWebrtcIngest(webrtcLiveId: string) {
    const res = await axios.post(
      "https://api.mux.com/video/v1/webrtc-ingests",
      {
        webrtc_live_id: webrtcLiveId,
      },
      {
        auth: {
          username: process.env.MUX_TOKEN_ID!,
          password: process.env.MUX_TOKEN_SECRET!,
        },
      }
    );

    return {
      ingestUrl: res.data.data.ingest_url,
      token: res.data.data.token,
    };
  }
}

