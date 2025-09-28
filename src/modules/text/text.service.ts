import { Injectable } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class TextService {
  constructor(private readonly strapi: StrapiService) {}

  async getTextPage(page: string, locale: string) {
    const componentName = "TextComponent";

    const endpoint = `/${page}-page?locale=${locale}&populate[${componentName}][populate]=*`;

    return this.strapi.get(endpoint);
  }
}
