import { Injectable } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class SitemapService {
  constructor(private readonly strapi: StrapiService) {}

  async getUrls() {
    const urls: { loc: string; changefreq: string; priority: number }[] = [];

    // 📌 1. Статичні сторінки
    const staticPages = [
      { path: "", changefreq: "daily", priority: 1.0 }, // головна
      { path: "about", changefreq: "weekly", priority: 0.8 },
      { path: "ambassadors", changefreq: "weekly", priority: 0.9 },
      { path: "become-ambassador", changefreq: "monthly", priority: 0.6 },
      { path: "privacy", changefreq: "monthly", priority: 0.3 },
      { path: "agreement", changefreq: "monthly", priority: 0.3 },
      { path: "disclaimer", changefreq: "monthly", priority: 0.3 },
      { path: "terms", changefreq: "monthly", priority: 0.3 },
    ];

    const locales = ["en", "uk", "es", "fr"]; // можна розширити

    staticPages.forEach((page) => {
      locales.forEach((lang) => {
        let loc =
          lang === "en"
            ? `https://time2fest.com/${page.path}`
            : `https://time2fest.com/${lang}/${page.path}`;

        // для головної сторінки залишаємо фінальний "/"
        if (!page.path) {
          loc =
            lang === "en"
              ? "https://time2fest.com/"
              : `https://time2fest.com/${lang}/`;
        } else {
          loc = loc.replace(/\/$/, ""); // прибираємо лишній слеш тільки для внутрішніх
        }

        urls.push({
          loc,
          changefreq: page.changefreq,
          priority: page.priority,
        });
      });
    });

    // 📌 2. Динамічні сторінки з Strapi — країни
    // const countries: any = await this.strapi.get(
    //   `/countries?locale=all&pagination[limit]=100`
    // );
    // countries?.data?.forEach((country: any) => {
    //   const loc =
    //     country.locale === "uk"
    //       ? `https://time2fest.com/country/${country.slug}`
    //       : `https://time2fest.com/${country.locale}/country/${country.slug}`;
    //   urls.push({
    //     loc,
    //     changefreq: "weekly",
    //     priority: 0.7,
    //   });
    // });

    // // 📌 3. Динамічні сторінки з Strapi — часові пояси
    // const timezones: any = await this.strapi.get(
    //   `/timezones?locale=all&pagination[limit]=100`
    // );
    // timezones?.data?.forEach((zone: any) => {
    //   const loc =
    //     zone.locale === "uk"
    //       ? `https://time2fest.com/timezone/${zone.slug}`
    //       : `https://time2fest.com/${zone.locale}/timezone/${zone.slug}`;
    //   urls.push({
    //     loc,
    //     changefreq: "weekly",
    //     priority: 0.7,
    //   });
    // });

    return urls;
  }
}
