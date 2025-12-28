// src/modules/live/mux.service.ts
import { Injectable } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class MuxService {
  async createWebrtcIngest(liveStreamId: string) {
    const res = await axios.post(
      "https://api.mux.com/video/v1/webrtc-ingests",
      { live_stream_id: liveStreamId },
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
