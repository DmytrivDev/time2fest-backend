import { Controller, Post, Body } from '@nestjs/common';
import { AmbassadorsService } from './ambassadors.service';
import { CreateAmbassadorDto } from './dto/create-ambassador.dto';

@Controller('ambassadors')
export class AmbassadorsController {
  constructor(private readonly ambassadorsService: AmbassadorsService) {}

  @Post()
  async create(@Body() data: CreateAmbassadorDto) {
    return this.ambassadorsService.processApplication(data);
  }
}
