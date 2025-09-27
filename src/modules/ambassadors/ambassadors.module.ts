import { Module } from '@nestjs/common';
import { AmbassadorsService } from './ambassadors.service';
import { AmbassadorsController } from './ambassadors.controller';
import { StrapiModule } from '../strapi/strapi.module';

@Module({
  imports: [StrapiModule],
  providers: [AmbassadorsService],
  controllers: [AmbassadorsController],
})
export class AmbassadorsModule {}
