import { Module } from '@nestjs/common';
import { CountriesService } from './countries.service';
import { CountriesController } from './countries.controller';
import { StrapiService } from '../../services/strapi.service';

@Module({
  providers: [CountriesService, StrapiService],
  controllers: [CountriesController],
})
export class CountriesModule {}