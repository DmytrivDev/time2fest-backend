// src/modules/live/live.controller.ts

import { Controller, Get, Query } from "@nestjs/common";
import { LiveService } from "./live.service";

@Controller("live-streams")
export class LiveController {
  constructor(private readonly liveService: LiveService) {}

  @Get()
  async getAll(
    @Query("country") country?: string,
    @Query("timeZone") timeZone?: string
  ) {
    return this.liveService.getAll(country, timeZone);
  }
}
