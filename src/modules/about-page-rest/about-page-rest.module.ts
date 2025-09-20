import { Module } from '@nestjs/common';
import { AboutPageRestService } from './about-page-rest.service';
import { AboutPageRestController } from './about-page-rest.controller';
import { StrapiModule } from '../strapi/strapi.module';

@Module({
  imports: [StrapiModule],
  providers: [AboutPageRestService],
  controllers: [AboutPageRestController],
})
export class AboutPageRestModule {}
