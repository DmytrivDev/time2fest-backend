import { Injectable } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class faqContentService {
  constructor(private readonly strapi: StrapiService) {}

  async getfaqContent(locale: string) {
    return this.strapi.get(
      `/faq?locale=${locale}&populate=*`
    );
  }
}
