// src/seo-meta/seo-meta.controller.ts
import { Controller, Get, Query } from "@nestjs/common";
import { SeoMetaService } from "./seo-meta.service";

@Controller("seo")
export class SeoMetaController {
  constructor(private readonly seoMeta: SeoMetaService) {}

  // GET /seo?locale=uk
  @Get()
  async getSeo(@Query("page") page: string, @Query("locale") locale: string) {
    return this.seoMeta.getSeoMeta(page, locale);
  }
}
