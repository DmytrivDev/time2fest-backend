import { Module } from '@nestjs/common';
import { AmbassPageRestService } from './ambass-page-rest.service';
import { AmbassPageRestController } from './ambass-page-rest.controller';
import { StrapiModule } from '../strapi/strapi.module';

@Module({
  imports: [StrapiModule],
  providers: [AmbassPageRestService],
  controllers: [AmbassPageRestController],
})
export class AmbassPageRestModule {}
