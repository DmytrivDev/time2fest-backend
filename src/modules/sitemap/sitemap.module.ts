import { Module } from '@nestjs/common';
import { SitemapController } from './sitemap.controller';
import { SitemapService } from './sitemap.service';
import { StrapiModule } from '../strapi/strapi.module';
import { AmbassadorsListModule } from '../ambassadors-list/ambassadors-list.module'; // ✅ додаємо

@Module({
  imports: [
    StrapiModule,           // модуль для StrapiService
    AmbassadorsListModule,  // ✅ модуль, який експортує AmbassadorsListService
  ],
  controllers: [SitemapController],
  providers: [SitemapService],
})
export class SitemapModule {}
