// src/about-content/about-content.module.ts
import { Module } from '@nestjs/common';
import { AboutContentService } from './about-content.service';
import { AboutContentController } from './about-content.controller';
import { StrapiModule } from '../strapi/strapi.module';

@Module({
  imports: [StrapiModule],
  providers: [AboutContentService],
  controllers: [AboutContentController],
})
export class AboutContentModule {}