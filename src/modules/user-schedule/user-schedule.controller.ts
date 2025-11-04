import { Controller, Get, Patch, Req, Body, UseGuards } from '@nestjs/common';
import { UserScheduleService } from './user-schedule.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // твій guard

@Controller('user-schedule')
@UseGuards(JwtAuthGuard)
export class UserScheduleController {
  constructor(private readonly service: UserScheduleService) {}

  @Get()
  async getSchedule(@Req() req: any) {
    return this.service.getByUser(req.user.id);
  }

  @Patch()
  async updateSchedule(@Req() req: any, @Body() body: any) {
    return this.service.update(req.user.id, body.countries || []);
  }
}
