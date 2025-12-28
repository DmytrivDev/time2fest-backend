// src/modules/live/mux.service.ts
import { Injectable } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class MuxService {
  async createWebrtcIngest(liveStreamId: string) {
    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;

    console.log("▶ [MuxService] createWebrtcIngest called", {
      liveStreamId,
      hasTokenId: !!tokenId,
      hasTokenSecret: !!tokenSecret,
    });

    if (!tokenId || !tokenSecret) {
      console.error("❌ [MuxService] MUX tokens are missing");
      throw new Error("MUX_TOKEN_ID or MUX_TOKEN_SECRET is not set");
    }

    try {
      const res = await axios.post(
        "https://api.mux.com/video/v1/webrtc-ingests",
        {
          live_stream_id: liveStreamId,
        },
        {
          auth: {
            username: tokenId,
            password: tokenSecret,
          },
        }
      );

      console.log("✅ [MuxService] WebRTC ingest created", {
        ingestUrl: res.data?.data?.ingest_url,
        hasToken: !!res.data?.data?.token,
      });

      return {
        ingestUrl: res.data.data.ingest_url,
        token: res.data.data.token,
      };
    } catch (e: any) {
      console.error("❌ [MuxService] WebRTC ingest FAILED");
      console.error("Status:", e?.response?.status);
      console.error("Response data:", e?.response?.data);
      console.error("Message:", e.message);

      throw e;
    }
  }
}
