import { Controller, Get } from '@nestjs/common';
import { HeroContentService } from './hero-content.service';

@Controller('/heroes')
export class HeroContentController {
  constructor(private readonly heroContentService: HeroContentService) {}

  @Get()
  async getHero() {
    return this.heroContentService.getHero();
  }
}