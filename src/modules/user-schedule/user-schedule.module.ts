import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSchedule } from './user-schedule.entity';
import { UserScheduleService } from './user-schedule.service';
import { UserScheduleController } from './user-schedule.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserSchedule])],
  providers: [UserScheduleService],
  controllers: [UserScheduleController],
})
export class UserScheduleModule {}
