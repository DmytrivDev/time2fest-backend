import { Controller, Post, Body, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('api')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Post('update-profile')
  async updateProfile(
    @Req() req: { user?: { id: number } },
    @Body() dto: UpdateProfileDto,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found or unauthorized');

    return this.userService.updateProfile(userId, dto);
  }
}
