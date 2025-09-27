import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import fetch from 'node-fetch';
import { CreateAmbassadorDto } from './dto/create-ambassador.dto';

@Injectable()
export class AmbassadorsService {
  async processApplication(data: CreateAmbassadorDto) {
    try {
      // 1. Надсилаємо у Telegram
      await this.sendToTelegram(data);

      // 2. Надсилаємо у Strapi
      await this.sendToStrapi(data);

      return { success: true };
    } catch (err) {
      console.error(err);
      throw new HttpException('Помилка при обробці заявки', HttpStatus.BAD_REQUEST);
    }
  }

  private async sendToTelegram(data: CreateAmbassadorDto) {
    const TOKEN = process.env.TELEGRAM_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    const URI_API = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

    const message = `
🔔 Нова заявка Time2Fest
👤 Ім’я: ${data.name}
🌍 Країна: ${data.country}
📞 Контакт: ${data.contactMethod} → ${data.contactLink}
📝 Мотивація: ${data.motivation}
    `;

    await fetch(URI_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
    });
  }

  private async sendToStrapi(data: CreateAmbassadorDto) {
    const STRAPI_URL = process.env.STRAPI_URL;
    const STRAPI_TOKEN = process.env.STRAPI_TOKEN;

    await fetch(`${STRAPI_URL}/api/ambassadors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
      body: JSON.stringify({ data }),
    });
  }
}
