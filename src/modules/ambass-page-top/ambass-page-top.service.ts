import { Injectable } from '@nestjs/common';
import { StrapiService } from '../../services/strapi.service';

@Injectable()
export class AmbassPageTopService {
  constructor(private readonly strapi: StrapiService) {}

  async getAmbassPageTop(locale: string) {
    const url =
      `/ambass-page?locale=${locale}` +
      `&populate[Hero][populate]=HeroList`;

    return this.strapi.get(url);
  }
}
