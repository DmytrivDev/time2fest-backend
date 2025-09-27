import { Module } from '@nestjs/common';
import { AmbassadorsController } from './ambassadors.controller';
import { AmbassadorsService } from './ambassadors.service';

@Module({
  controllers: [AmbassadorsController],
  providers: [AmbassadorsService],
})
export class AmbassadorsModule {}
