import { Injectable } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class AboutPageRestService {
  constructor(private readonly strapi: StrapiService) {}

  async getAboutPageRest(locale: string) {
    const url =
      `/about-page?locale=${locale}` +
      `&populate[WhyWe][populate][WhyWeList][populate]=Icon` +
      `&populate[Steps][populate][StrpsList][populate]=Icon` +
      `&populate[FreePlan][populate][FreePlanList][populate]=Image` +
      `&populate[PaidPlan][populate][PaidPlanList][populate]=Image` +
      `&populate[Ambasadors][populate]=AmbasadorsList` +
      `&populate[FAQ][populate]=FAQList` +
      `&populate[Technic][populate]=TechnicList` +
      `&populate[Way][populate]=WayList` +
      `&populate[CTO][populate]=Image`;

    return this.strapi.get(url);
  }
}
