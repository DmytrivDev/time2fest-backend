import { Module } from '@nestjs/common';
import { ProfilePageService } from './profile-page.service';
import { ProfilePageController } from './profile-page.controller';
import { StrapiModule } from '../strapi/strapi.module';

@Module({
  imports: [StrapiModule],
  providers: [ProfilePageService],
  controllers: [ProfilePageController],
})
export class ProfilePageModule {}
