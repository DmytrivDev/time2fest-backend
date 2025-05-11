import { Injectable } from '@nestjs/common';
import { StrapiService } from '../../services/strapi.service';

@Injectable()
export class HeroContentService {
  constructor(private readonly strapi: StrapiService) {}

  async getHero() {
    const data = await this.strapi.get<any[]>('/api/heroes');
    const hero = data?.[0];

    return hero
      ? {
          title: hero.Title,
          subtitle: hero.Subtitle,
          imageUrl: hero.Image?.data?.attributes?.url || null,
        }
      : null;
  }
}