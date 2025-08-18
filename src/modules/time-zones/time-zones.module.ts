// src/modules/time-zone/time-zone.module.ts
import { Module } from "@nestjs/common";
import { TimeZonesService } from "./time-zones.service";
import { TimeZonesController } from "./time-zones.controller";
import { StrapiService } from "../../services/strapi.service";

@Module({
  providers: [TimeZonesService, StrapiService],
  controllers: [TimeZonesController],
  exports: [TimeZonesService], // якщо десь ще захочеш інжектити сервіс
})
export class TimeZonesModule {}

