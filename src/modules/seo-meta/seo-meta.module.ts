// src/seo-meta/seo-meta.module.ts
import { Module } from '@nestjs/common';
import { SeoMetaService } from './seo-meta.service';
import { SeoMetaController } from './seo-meta.controller';
import { StrapiModule } from '../strapi/strapi.module';

@Module({
  imports: [StrapiModule],
  providers: [SeoMetaService],
  controllers: [SeoMetaController],
})
export class SeoMetaModule {}