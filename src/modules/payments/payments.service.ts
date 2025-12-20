import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly usersService: UserService) {}

  async handlePayProIpn(payload: any) {
    if (!payload || typeof payload !== 'object') {
      console.warn('⚠️ Empty or invalid IPN payload');
      return;
    }

    const status =
      payload.payment_status ||
      payload.order_status;

    const email =
      payload.email ||
      payload.customer_email;

    const orderId =
      payload.order_id ||
      payload.invoice_id;

    console.log('🔎 Status:', status);
    console.log('🔎 Email:', email);
    console.log('🔎 Order ID:', orderId);

    // ❌ якщо платіж не завершений — просто ігноруємо
    if (!['approved', 'paid', 'completed'].includes(status)) {
      console.log('ℹ️ Payment not completed:', status);
      return;
    }

    if (!email) {
      console.warn('⚠️ No email in IPN');
      return;
    }

    /**
     * 🔒 ВАЖЛИВО (рекомендую додати наступним кроком)
     * - перевірка, чи orderId вже оброблявся
     * - інакше PayPro може активувати premium кілька разів
     */

    console.log('🎉 Activating premium for:', email);
    await this.usersService.setPremium(email);
  }
}
