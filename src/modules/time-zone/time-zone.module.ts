// src/time-zone/time-zone.module.ts
import { Module } from "@nestjs/common";
import { TimeZoneService } from "./time-zone.service";
import { TimeZoneController } from "./time-zone.controller";
import { StrapiService } from "../../services/strapi.service";

@Module({
  providers: [TimeZoneService, StrapiService],
  controllers: [TimeZoneController],
})
export class TimeZoneModule {}
