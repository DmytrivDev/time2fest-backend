// src/hero-content/hero-content.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { HeroContentService } from './hero-content.service';

@Controller('hero')
export class HeroContentController {
  constructor(private readonly heroService: HeroContentService) {}

  // GET /hero?locale=uk
  @Get()
  async getHero(@Query('locale') locale = 'en') {
    return this.heroService.getHeroContent(locale);
  }
}