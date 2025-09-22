import { Module } from '@nestjs/common';
import { AmbassPageTopService } from './ambass-page-top.service';
import { AmbassPageTopController } from './ambass-page-top.controller';
import { StrapiModule } from '../strapi/strapi.module';

@Module({
  imports: [StrapiModule],
  providers: [AmbassPageTopService],
  controllers: [AmbassPageTopController],
})
export class AmbassPageTopModule {}
