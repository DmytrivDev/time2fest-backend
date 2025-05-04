import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hero } from './entities/hero.entity';
import { HeroService } from './hero.service';
import { HeroController } from './hero.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Hero])],
  providers: [HeroService],
  controllers: [HeroController],
})
export class HeroModule {}