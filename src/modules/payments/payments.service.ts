import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly usersService: UserService) {}

  async handlePayProIpn(payload: any) {
    /**
     * Типовий payload PayPro містить:
     * - email
     * - product_id
     * - order_status / payment_status
     */

    const status =
      payload.payment_status ||
      payload.order_status;

    const email =
      payload.email ||
      payload.customer_email;

    console.log('🔎 Status:', status);
    console.log('🔎 Email:', email);

    // ✅ головна умова
    if (
      status === 'approved' ||
      status === 'completed' ||
      status === 'paid'
    ) {
      if (!email) {
        console.warn('⚠️ No email in IPN');
        return;
      }

      console.log('🎉 Activating premium for:', email);
      await this.usersService.setPremium(email);
    } else {
      console.log('ℹ️ Payment not completed:', status);
    }
  }
}
