// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseCoreConfig, databaseCmsConfig } from './config/database.config';
import { HeroModule } from './modules/hero/hero.module';
import { HeroContentModule } from './modules/hero-content/hero-content.module';


@Module({
  imports: [
    TypeOrmModule.forRoot(databaseCoreConfig),
    TypeOrmModule.forRoot(databaseCmsConfig),
    HeroModule,
    HeroContentModule,
  ],
})
export class AppModule {}