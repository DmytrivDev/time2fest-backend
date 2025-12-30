// src/modules/live/live.controller.ts

import { Controller, Get, Query, Res } from "@nestjs/common";
import { Response } from "express";
import { LiveService } from "./live.service";

@Controller("live-streams")
export class LiveController {
  constructor(private readonly liveService: LiveService) {}

  @Get()
  async getAll(
    @Query("country") country?: string,
    @Query("timeZone") timeZone?: string,
    @Query("ambassador") ambassadorSlug?: string,
    @Res({ passthrough: true }) res?: Response
  ) {
    // 🚨 Заборона кешу на HTTP / CDN рівні
    res?.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res?.setHeader("Pragma", "no-cache");
    res?.setHeader("Expires", "0");

    return this.liveService.getAll(country, timeZone, ambassadorSlug);
  }
}
