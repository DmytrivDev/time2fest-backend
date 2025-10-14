import { Injectable } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";
import { AmbassadorsListService } from "../ambassadors-list/ambassadors-list.service";

@Injectable()
export class SitemapService {
  constructor(
    private readonly strapi: StrapiService,
    private readonly ambassadorsList: AmbassadorsListService
  ) {}

  async getUrls() {
    const urls: { loc: string; changefreq: string; priority: number }[] = [];
    const baseUrl = "https://time2fest.com";
    const locales = ["en", "uk", "es", "fr"];
 
    // 📌 1. Статичні сторінки
    const staticPages = [
      { path: "", changefreq: "daily", priority: 1.0 }, // головна
      { path: "about", changefreq: "weekly", priority: 0.8 },
      { path: "ambassadors", changefreq: "weekly", priority: 0.9 },
      { path: "become-ambassador", changefreq: "monthly", priority: 0.6 },
      { path: "contact", changefreq: "monthly", priority: 0.3 },
      { path: "privacy", changefreq: "monthly", priority: 0.3 },
      { path: "agreement", changefreq: "monthly", priority: 0.3 },
      { path: "disclaimer", changefreq: "monthly", priority: 0.3 },
      { path: "terms", changefreq: "monthly", priority: 0.3 },
    ];

    staticPages.forEach((page) => {
      locales.forEach((lang) => {
        let loc =
          lang === "en"
            ? `${baseUrl}/${page.path}` 
            : `${baseUrl}/${lang}/${page.path}`;

        if (!page.path) {
          loc = lang === "en" ? `${baseUrl}/` : `${baseUrl}/${lang}/`;
        } else {
          loc = loc.replace(/\/$/, "");
        }

        urls.push({
          loc,
          changefreq: page.changefreq,
          priority: page.priority,
        });
      });
    });

    // 📌 2. Динамічні сторінки амбасадорів
    try {
      // один запит на всі локалі, як у твоєму сервісі
      const ambassadors: any[] = await this.ambassadorsList.getAll("all");

      ambassadors.forEach((amb) => {
        const slug = amb.slug;
        const locale = amb.locale || "en";
        if (!slug) return;

        const loc =
          locale === "en"
            ? `${baseUrl}/ambassadors/list/${slug}`
            : `${baseUrl}/${locale}/ambassadors/list/${slug}`;

        urls.push({
          loc,
          changefreq: "weekly",
          priority: 0.7,
        });
      });
    } catch (err) {
      console.error("❌ Error fetching ambassadors for sitemap:", err);
    }

    return urls;
  }
}
