import { Module } from '@nestjs/common';
import { AboutPageTopService } from './about-page-top.service';
import { AboutPageTopController } from './about-page-top.controller';
import { StrapiModule } from '../strapi/strapi.module';

@Module({
  imports: [StrapiModule],
  providers: [AboutPageTopService],
  controllers: [AboutPageTopController],
})
export class AboutPageTopModule {}
