import { Controller, Get, Query } from '@nestjs/common';
import { ProfilePageService } from './profile-page.service';

@Controller('profile-page')
export class ProfilePageController {
  constructor(private readonly profilePageService: ProfilePageService) {}

  // GET /profile-page?locale=uk
  @Get()
  async getProfilePage(@Query('locale') locale = 'en') {
    return this.profilePageService.getProfilePage(locale);
  }
}
