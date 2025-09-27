import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { StrapiService } from "../../services/strapi.service";
import { CreateAmbassadorDto } from "./dto/create-ambassador.dto";
import axios from "axios";

@Injectable()
export class AmbassadorsService {
  constructor(private readonly strapi: StrapiService) {}

  async processApplication(data: CreateAmbassadorDto) {
    try {
      console.log("👉 Received DTO:", data);

      // 1. Надсилаємо в Telegram
      await this.sendToTelegram(data);

      // 2. Надсилаємо в Strapi
      const strapiRes = await this.sendToStrapi(data);

      console.log("✅ Strapi response:", strapiRes);

      return { success: true, strapiRes };
    } catch (err: any) {
      console.error(
        "❌ processApplication failed:",
        err?.response?.data || err.message || err
      );
      throw new HttpException(
        err?.response?.data || "Помилка при обробці заявки",
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

    console.log("📤 Sending to Telegram:", message);

    try {
      const res = await axios.post(URI_API, {
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      });
      console.log("✅ Telegram response:", res.data);
    } catch (err: any) {
      console.error(
        "❌ Telegram send failed:",
        err?.response?.data || err.message || err
      );
    }
  }

  private async sendToStrapi(data: CreateAmbassadorDto) {
    console.log("📤 Sending to Strapi:", data);

    try {
      const res = await this.strapi.post("/ambassadors", { data }); // 👈 важливо обгорнути у { data }
      console.log("✅ Strapi POST success");
      return res;
    } catch (err: any) {
      console.error(
        "❌ Strapi POST failed:",
        err?.response?.data || err.message || err
      );
      throw err;
    }
  }
}
