// seo-meta.service.ts
import { Injectable } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class SeoMetaService {
  constructor(private readonly strapi: StrapiService) {}

  async getSeoMeta(page: string, locale: string) {
    const collection = `${page}-seo-meta`; // home-seo-meta, about-seo-meta
    const componentName = `${page.charAt(0).toUpperCase()}${page.slice(1)}SeoMeta`; // HomeSeoMeta, AboutSeoMeta

    const res = await this.strapi.get(
      `/${collection}?locale=${locale}&populate=${componentName}.shareImage`
    );

    return res;
  }
}