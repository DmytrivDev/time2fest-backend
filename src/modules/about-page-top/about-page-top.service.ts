import { Injectable } from '@nestjs/common';
import { StrapiService } from '../../services/strapi.service';

@Injectable()
export class AboutPageTopService {
  constructor(private readonly strapi: StrapiService) {}

  async getAboutPageTop(locale: string) {
    const url =
      `/about-page?locale=${locale}` +
      `&populate[HeroAbout][populate]=Icon` +
      `&populate[WhyWe][populate]=WhyWeList`;

    return this.strapi.get(url);
  }
}
