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

    let muxWebrtcLiveId = live.muxWebrtcLiveId;
    let playbackId = live.playbackId;

    // 1️⃣ якщо ще не створений WebRTC Live — створюємо
    if (!muxWebrtcLiveId || !playbackId) {
      const created = await this.mux.createWebrtcLive();

      muxWebrtcLiveId = created.liveId;
      playbackId = created.playbackId;

      await this.repo.saveMuxData(live.id, muxWebrtcLiveId, playbackId);
    }

    // 2️⃣ створюємо ingest
    let ingest;
    try {
      ingest = await this.mux.createWebrtcIngest(muxWebrtcLiveId);
    } catch (e) {
      throw new InternalServerErrorException("Failed to create WebRTC ingest");
    }

    // 3️⃣ міняємо статус
    await this.repo.updateStatus(live.id, "process");

    return {
      ingestUrl: ingest.ingestUrl,
      token: ingest.token,
      playbackId,
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
