import { Injectable } from '@nestjs/common';
import axios from 'axios';
import NodeCache from 'node-cache';
import { getStrapiHeaders, getStrapiUrl } from '../config/strapi.config';

@Injectable()
export class StrapiService {
  private readonly cache = new NodeCache({ stdTTL: 300 }); // 5 хв

  async get<T>(endpoint: string, useCache = true): Promise<T | null> {
    const url = getStrapiUrl(endpoint);
    const cacheKey = `strapi:${endpoint}`;

    // 👉 Якщо кеш є — віддаємо
    if (useCache) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached) return cached;
    }

    try {
      const { data } = await axios.get<{ data: T }>(url, {
        headers: getStrapiHeaders(),
      });

      const result = data.data;

      if (useCache) {
        this.cache.set(cacheKey, result);
      }

      return result;
    } catch (error: any) {
      console.error(`❌ StrapiService.get(${endpoint}) failed:`, error?.response?.data || error.message);
      return null;
    }
  }

  clearCache(endpoint?: string) {
    if (endpoint) {
      this.cache.del(`strapi:${endpoint}`);
    } else {
      this.cache.flushAll();
    }
  }
}