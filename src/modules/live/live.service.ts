// src/modules/live/live.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { LiveRepository } from "./live.repository";
import { MuxService } from "./mux.service";

@Injectable()
export class LiveService {
  constructor(
    private readonly repo: LiveRepository,
    private readonly mux: MuxService
  ) {}

  async getLive(slug: string) {
    console.log("▶ [LiveService] getLive", { slug });

    const live = await this.repo.findBySlug(slug);
    if (!live) {
      console.warn("❌ [LiveService] Live not found", { slug });
      throw new NotFoundException("Live not found");
    }

    return live;
  }

  async startLive(slug: string) {
    console.log("▶ [LiveService] startLive called", { slug });

    const live = await this.repo.findBySlug(slug);
    if (!live) {
      console.warn("❌ [LiveService] Live not found", { slug });
      throw new NotFoundException("Live not found");
    }

    console.log("▶ [LiveService] Live loaded", {
      id: live.id,
      trstatus: live.trstatus,
      muxLiveStreamId: live.muxLiveStreamId,
    });

    if (live.trstatus !== "prestart") {
      console.warn("❌ [LiveService] Invalid status", {
        expected: "prestart",
        actual: live.trstatus,
      });
      throw new BadRequestException("Live already started or ended");
    }

    let ingest;
    try {
      ingest = await this.mux.createWebrtcIngest(
        live.muxLiveStreamId
      );
    } catch (e) {
      console.error("❌ [LiveService] Failed to create Mux ingest");
      throw new InternalServerErrorException(
        "Failed to create Mux ingest"
      );
    }

    await this.repo.updateStatus(live.id, "process");
    console.log("✅ [LiveService] Live status updated to process", {
      liveId: live.id,
    });

    return {
      ingestUrl: ingest.ingestUrl,
      token: ingest.token,
    };
  }

  async endLive(slug: string) {
    console.log("▶ [LiveService] endLive called", { slug });

    const live = await this.repo.findBySlug(slug);
    if (!live) {
      console.warn("❌ [LiveService] Live not found", { slug });
      throw new NotFoundException("Live not found");
    }

    if (live.trstatus !== "process") {
      console.warn("❌ [LiveService] Live not active", {
        trstatus: live.trstatus,
      });
      throw new BadRequestException("Live not active");
    }

    await this.repo.updateStatus(live.id, "end");
    console.log("✅ [LiveService] Live ended", { liveId: live.id });

    return { ok: true };
  }
}
