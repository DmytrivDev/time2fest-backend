import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  // --- Зміна імені профілю ---
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

  // --- Зміна пароля ---
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Req() req: { user?: { id: number } },
    @Body() dto: ChangePasswordDto,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found or unauthorized');

    const success = await this.userService.changePassword(userId, dto);

    if (!success) {
      throw new BadRequestException('Invalid current password');
    }

    return { message: 'Password changed successfully' };
  }
}
