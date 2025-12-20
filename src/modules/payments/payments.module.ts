import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { UserModule } from '../user/user.module';
import { PaymentsRepository } from './payments.repository';

@Module({
  imports: [UserModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsRepository],
})
export class PaymentsModule {}
 