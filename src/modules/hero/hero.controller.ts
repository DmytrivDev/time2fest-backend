import { Controller, Get } from '@nestjs/common';
import { HeroService } from './hero.service';
import { Hero } from './entities/hero.entity';

@Controller('hero')
export class HeroController {
  constructor(private readonly heroService: HeroService) {}

  @Get()
  findAll(): Promise<Hero[]> {
    return this.heroService.findAll();
  }

  @Get('create')
  createTest(): Promise<Hero> {
    return this.heroService.createTestHero();
  }
}