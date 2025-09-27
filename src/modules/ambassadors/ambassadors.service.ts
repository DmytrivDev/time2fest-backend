import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { StrapiService } from '../../services/strapi.service';
import { CreateAmbassadorDto } from "./dto/create-ambassador.dto";
import axios from "axios";

@Injectable()
export class AmbassadorsService {
  constructor(private readonly strapi: StrapiService) {}

  async processApplication(data: CreateAmbassadorDto) {
    try {
      // 1. Надсилаємо в Telegram
      await this.sendToTelegram(data);

      // 2. Надсилаємо в Strapi
      await this.sendToStrapi(data);

      return { success: true };
    } catch (err) {
      console.error(err);
      throw new HttpException(
        "Помилка при обробці заявки",
        HttpStatus.BAD_REQUEST
      );
    }
  }

  private async sendToTelegram(data: Record<string, any>) {
    const TOKEN = process.env.TELEGRAM_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    const URI_API = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

    // Формуємо повідомлення автоматично з ключів DTO
    const lines = Object.entries(data)
      .map(([key, value]) => {
        if (value === undefined || value === null || value === "") return null;

        if (typeof value === "object") {
          const sub = Object.entries(value)
            .map(([subKey, subVal]) => `   • ${subKey}: ${subVal}`)
            .join("\n");
          return `*${key}:*\n${sub}`;
        }

        return `*${key}:* ${value}`;
      })
      .filter(Boolean);

    const message = `🔔 Нова заявка Time2Fest\n\n${lines.join("\n")}`;

    await axios.post(URI_API, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "Markdown",
    });
  }

  private async sendToStrapi(data: CreateAmbassadorDto) {
    return this.strapi.post("/ambassadors", data); // StrapiService вже обгортає { data }
  }
}
