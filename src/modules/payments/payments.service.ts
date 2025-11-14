import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PaymentsService {
  private readonly api = axios.create({
    baseURL: 'https://sandbox-api.paddle.com', // prod → https://api.paddle.com
    headers: {
      Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  async createCheckout(email: string) {
    const priceId = process.env.PADDLE_PRICE_ID;

    const res = await this.api.post('/checkout/sessions', {
      items: [{ price_id: priceId }],
      customer: { email },
      success_url: 'https://time2fest.com/profile/payments?success=true',
      cancel_url: 'https://time2fest.com/profile/payments?cancel=true',
    });

    return res.data.data;
  }
}