import { Module } from '@nestjs/common';
import { SitemapController } from './sitemap.controller';
import { SitemapService } from './sitemap.service';
import { StrapiModule } from '../strapi/strapi.module';

@Module({
  imports: [StrapiModule],
  controllers: [SitemapController],
  providers: [SitemapService],
})
export class SitemapModule {}