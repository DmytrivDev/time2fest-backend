import { Injectable } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class TextService {
  constructor(private readonly strapi: StrapiService) {}

  async getTextPage(page: string, locale: string) {
    // автоматично будуємо endpoint під Strapi
    // наприклад: privacy → /privacy-page
    const endpoint = `/${page}-page?locale=${locale}&populate[Hero][populate]=*`;

    return this.strapi.get(endpoint);
  }
}
