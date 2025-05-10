import { Injectable } from '@nestjs/common';
import NodeCache from 'node-cache';
import axios from 'axios';

@Injectable()
export class HeroContentService {
  private readonly cache = new NodeCache({ stdTTL: 300 }); // 5 хв кеш

  private readonly strapiUrl = 'http://localhost:1337/api/heroes'; // не 3000!

  async getHero(): Promise<any> {
    const cacheKey = 'hero-content';

    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await axios.get(this.strapiUrl);

      const hero = data.data?.[0];

      const result = hero
        ? {
            title: hero.Title,
            subtitle: hero.Subtitle,
            imageUrl: null, // якщо додаш image пізніше — оновимо
          }
        : null;

      this.cache.set(cacheKey, result);
      return result;
    } catch (error: any) {
      console.error('💥 Strapi fetch error:', error?.response?.data || error.message || error);
      throw new Error('Failed to load hero content');
    }
  }
}