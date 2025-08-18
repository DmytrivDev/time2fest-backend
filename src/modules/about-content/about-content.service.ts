import { Injectable } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class AboutContentService {
  constructor(private readonly strapi: StrapiService) {}

  async getAboutContent(locale: string) {
    return this.strapi.get(
      `/about-platform?locale=${locale}&populate[items][populate]=Icon`
    );
  }
}
