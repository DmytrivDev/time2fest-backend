import { Injectable } from '@nestjs/common';
import { StrapiService } from '../../services/strapi.service';

@Injectable()
export class ProfilePageService {
  constructor(private readonly strapi: StrapiService) {}

  async getProfilePage(locale: string) {
    const url =
      `/profile-home-page?locale=${locale}` +
      `&populate[Banner][populate]=Image` +
      `&populate[Video][populate]`;

    return this.strapi.get(url);
  }
} 
