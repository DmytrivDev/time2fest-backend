import { Injectable } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class CountriesService {
  constructor(private readonly strapi: StrapiService) {}

  async getCountry(code?: string, slug?: string, locale = "uk") {
    const qs = new URLSearchParams();
    qs.set("locale", locale);
    qs.set("populate", "*");

    // ---- Додаємо фільтр по коду або по слагу ----
    if (code) {
      qs.set("filters[CountryCode][$eq]", code.toUpperCase());
    }
    if (slug) {
      qs.set("filters[slug][$eq]", slug.toLowerCase());
    }

    const url = `/countries?${qs.toString()}`;
    return this.strapi.get(url);
  }
}
