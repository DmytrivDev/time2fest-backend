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
    const live = await this.repo.findBySlug(slug);
    if (!live) throw new NotFoundException("Live not found");
    return live;
  }

  async startLive(slug: string) {
    const live = await this.repo.findBySlug(slug);
    if (!live) throw new NotFoundException("Live not found");

    if (live.trstatus !== "prestart") {
      throw new BadRequestException("Live already started or ended");
    }

    let ingest;
    try {
      ingest = await this.mux.createWebrtcIngest(
        live.muxLiveStreamId
      );
    } catch (e) {
      throw new InternalServerErrorException("Failed to create Mux ingest");
    }

    await this.repo.updateStatus(live.id, "process");

    return {
      ingestUrl: ingest.ingestUrl,
      token: ingest.token,
    };
  }

  async endLive(slug: string) {
    const live = await this.repo.findBySlug(slug);
    if (!live) throw new NotFoundException("Live not found");

    if (live.trstatus !== "process") {
      throw new BadRequestException("Live not active");
    }

    await this.repo.updateStatus(live.id, "end");
    return { ok: true };
  }
}
