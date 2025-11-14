import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PaymentsService {
  private readonly api = axios.create({
    baseURL: 'https://sandbox-api.paddle.com', // PROD → https://api.paddle.com
    headers: {
      Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  async createCheckout(email: string) {
    const priceId = process.env.PADDLE_PRICE_ID;

    // 🔥 Перевіряємо ENV перед виконанням
    if (!process.env.PADDLE_API_KEY) {
      console.error('❌ PADDLE_API_KEY is missing');
      throw new InternalServerErrorException('Paddle API key is missing');
    }

    if (!priceId) {
      console.error('❌ PADDLE_PRICE_ID is missing');
      throw new InternalServerErrorException('Paddle price ID missing');
    }

    console.log('➡️ Creating Paddle checkout...', { email, priceId });

    try {
      const response = await this.api.post('/checkout/sessions', {
        items: [
          {
            price_id: priceId, // 🔥 правильне поле для Paddle 2.0
            quantity: 1,
          },
        ],
        customer: {
          email,
        },
        success_url:
          'https://time2fest.com/profile/payments?success=true',
        cancel_url:
          'https://time2fest.com/profile/payments?cancel=true',
      });

      console.log('✔️ Paddle response:', response.data);

      return response.data.data;

    } catch (error: any) {
      console.error('❌ Paddle Checkout Error');
      console.error(
        'Response:',
        error.response?.data || error.message,
      );

      throw new InternalServerErrorException(
        error.response?.data?.error || 'Paddle checkout failed',
      );
    }
  }
}
