import { Injectable } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";

@Injectable()
export class BecomeContentService {
  constructor(private readonly strapi: StrapiService) {}

  async getBecomeContent(locale: string) {
    return this.strapi.get(
      `/become-streamer?locale=${locale}&populate=*`
    );
  }
}
