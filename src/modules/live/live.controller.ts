// src/modules/live/live.controller.ts
import { Controller, Get, Post, Param } from "@nestjs/common";
import { LiveService } from "./live.service";

@Controller("live")
export class LiveController {
  constructor(private readonly service: LiveService) {}

  @Get(":slug")
  getLive(@Param("slug") slug: string) {
    return this.service.getLive(slug);
  }

  @Post(":slug/start")
  start(@Param("slug") slug: string) {
    return this.service.startLive(slug);
  }

  @Post(":slug/end")
  end(@Param("slug") slug: string) {
    return this.service.endLive(slug);
  }
}
