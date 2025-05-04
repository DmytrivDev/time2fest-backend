import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hero } from './entities/hero.entity';

@Injectable()
export class HeroService {
  constructor(
    @InjectRepository(Hero)
    private heroRepository: Repository<Hero>,
  ) {}

  async createTestHero(): Promise<Hero> {
    const newHero = this.heroRepository.create({
      title: 'Time2Fest Hero Block',
      subtitle: 'Celebrate anytime, anywhere',
      backgroundImage: 'hero-bg.jpg',
    });

    return this.heroRepository.save(newHero);
  }

  async findAll(): Promise<Hero[]> {
    return this.heroRepository.find();
  }
}
