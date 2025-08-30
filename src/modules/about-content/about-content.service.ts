import { Injectable } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class AboutContentService {
  constructor(private readonly strapi: StrapiService) {}

  async getAboutContent(locale: string) {
    console.log(2222);

    const data = await this.strapi.get(
      `/about-platform?locale=${locale}&populate[items][populate]=Icon`
    );

    console.log(3111);

    return data;
  }
}