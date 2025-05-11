import { Module } from '@nestjs/common';
import { HeroContentService } from './hero-content.service';
import { HeroContentController } from './hero-content.controller';
import { StrapiModule } from '../strapi/strapi.module';

@Module({
  imports: [StrapiModule],
  providers: [HeroContentService],
  controllers: [HeroContentController],
})
export class HeroContentModule {}