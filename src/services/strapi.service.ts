import { Injectable } from "@nestjs/common";
import axios from "axios";
import NodeCache from "node-cache";
import { getStrapiHeaders, getStrapiUrl } from "../config/strapi.config";

@Injectable()
export class StrapiService {
  private readonly cache = new NodeCache({ stdTTL: 300 }); // 5 хв

  async get<T>(
    endpoint: string,
    locale?: string,
    useCache = true,
    withMeta = false
  ): Promise<T | { data: T; meta: any } | null> {
    let fullPath = endpoint;

    if (locale) {
      const separator = endpoint.includes("?") ? "&" : "?";
      fullPath += `${separator}locale=${locale}&populate=deep`;
    }

    const url = getStrapiUrl(fullPath);
    const cacheKey = `strapi:${fullPath}:meta:${withMeta ? 1 : 0}`;

    if (useCache) {
      const cached = this.cache.get<T | { data: T; meta: any }>(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await axios.get(url, {
        headers: getStrapiHeaders(),
      });

      const result = withMeta
        ? {
            data: response.data?.data ?? response.data ?? null,
            meta: response.data?.meta ?? null,
          }
        : response.data?.data ?? response.data ?? null;

      if (useCache) {
        this.cache.set(cacheKey, result);
      }

      return result;
    } catch (error: any) {
      console.error(
        `❌ StrapiService.get(${fullPath}) failed:`,
        error?.response?.data || error.message
      );
      return null;
    }
  }

  async post<T>(endpoint: string, body: any): Promise<T | null> {
    const url = getStrapiUrl(endpoint);

    try {
      const { data } = await axios.post<{ data: T }>(url, body, {
        headers: getStrapiHeaders(),
      });

      return data.data;
    } catch (error: any) {
      console.error(
        `❌ StrapiService.post(${endpoint}) failed:`,
        error?.response?.data || error.message
      );
      return null;
    }
  }

  /**
   * ✅ REAL PUT ДЛЯ STRAPI v4
   */
  async put<T>(endpoint: string, body: any): Promise<T | null> {
    const url = getStrapiUrl(endpoint);

    try {
      const { data } = await axios.put<{ data: T }>(url, body, {
        headers: getStrapiHeaders(),
      });

      return data.data;
    } catch (error: any) {
      console.error(
        `❌ StrapiService.put(${endpoint}) failed:`,
        error?.response?.data || error.message
      );
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
