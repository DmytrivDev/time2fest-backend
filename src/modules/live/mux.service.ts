// src/modules/live/mux.service.ts
import { Injectable } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class MuxService {
  async createWebrtcIngest(liveStreamId: string) {
    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;

    if (!tokenId || !tokenSecret) {
      throw new Error("MUX_TOKEN_ID or MUX_TOKEN_SECRET is not set");
    }

    try {
      const res = await axios.post(
        "https://api.mux.com/video/v1/webrtc-ingests",
        { live_stream_id: liveStreamId },
        {
          auth: {
            username: tokenId,
            password: tokenSecret,
          },
        }
      );

      return {
        ingestUrl: res.data.data.ingest_url,
        token: res.data.data.token,
      };
    } catch (e: any) {
      console.error(
        "❌ Mux WebRTC ingest error:",
        e?.response?.data || e.message
      );
      throw e;
    }
  }
}
