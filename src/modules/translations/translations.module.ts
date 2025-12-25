// src/modules/translations/translations.module.ts

import { Module } from "@nestjs/common";
import { TranslationsController } from "./translations.controller";
import { TranslationsService } from "./translations.service";
import { StrapiService } from "../../services/strapi.service";

@Module({
  controllers: [TranslationsController],
  providers: [TranslationsService, StrapiService],
})
export class TranslationsModule {}
