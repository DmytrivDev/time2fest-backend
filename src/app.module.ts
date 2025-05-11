import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseCoreConfig } from './config/database.config';
import { HeroModule } from './modules/hero/hero.module';
import { HeroContentModule } from './modules/hero-content/hero-content.module';
import { StrapiModule } from './modules/strapi/strapi.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseCoreConfig),
    StrapiModule,
    HeroModule,
    HeroContentModule,
  ],
})
export class AppModule {}