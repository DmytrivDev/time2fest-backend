import { Module } from '@nestjs/common';
import { HeroContentService } from './hero-content.service';
import { HeroContentController } from './hero-content.controller';

@Module({
  controllers: [HeroContentController],
  providers: [HeroContentService],
})
export class HeroContentModule {}