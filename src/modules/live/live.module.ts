// src/modules/live/live.module.ts

import { Module } from "@nestjs/common";
import { LiveController } from "./live.controller";
import { LiveService } from "./live.service";
import { StrapiService } from "../../services/strapi.service";

@Module({
  controllers: [LiveController],
  providers: [LiveService, StrapiService], // 👈 ТУТ ФІКС
})
export class LiveModule {}
