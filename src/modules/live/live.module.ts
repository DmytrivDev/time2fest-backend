// src/modules/live/live.module.ts
import { Module } from "@nestjs/common";
import { LiveController } from "./live.controller";
import { LiveService } from "./live.service";
import { LiveRepository } from "./live.repository";
import { MuxService } from "./mux.service";
import { StrapiService } from "../../services/strapi.service";

@Module({
  controllers: [LiveController],
  providers: [
    LiveService,
    LiveRepository,
    MuxService,
    StrapiService,
  ],
})
export class LiveModule {}
