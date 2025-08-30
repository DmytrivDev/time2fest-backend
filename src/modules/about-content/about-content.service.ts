import { Injectable } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class AboutContentService {
  constructor(private readonly strapi: StrapiService) {}

  async getAboutContent(locale: string) {
    console.log(`[AboutContentService] fetching about content, locale=${locale}`);

    const data = await this.strapi.get(
      `/about-platform?locale=${locale}&populate[items][populate]=Icon`
    );

    console.log(`[AboutContentService] received data keys:`, Object.keys(data || {}));

    return data;
  }
}