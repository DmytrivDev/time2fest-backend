import { Injectable } from '@nestjs/common';
import { StrapiService } from '../../services/strapi.service';

@Injectable()
export class AmbassPageRestService {
  constructor(private readonly strapi: StrapiService) {}

  async getAmbassPageRest(locale: string) {
    const url =
      `/ambass-page?locale=${locale}` +
      `&populate[WhatDo][populate][WhatDoList][populate]=Image` +
      `&populate[Stream][populate][StreamList][populate]=Icon` +
      `&populate[WhatGet][populate][WhatGetList][populate]=Icon` +
      `&populate[WhatBecome][populate][WhatBecomeList][populate]=Icon` +
      `&populate[FAQ][populate]=FAQList`;

    return this.strapi.get(url);
  }
}
