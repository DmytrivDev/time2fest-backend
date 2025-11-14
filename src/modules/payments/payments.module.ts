import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    UserModule, // ⬅ потрібно, щоб мати доступ до UserService
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
