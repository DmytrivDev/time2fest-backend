import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import axios from "axios";
import { CreateContactDto } from "./dto/create-contact.dto";

@Injectable()
export class ContactsService {
  async sendToTelegram(data: CreateContactDto) {
    try {
      const TOKEN = process.env.TELEGRAM_TOKEN;
      const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
      const URI_API = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

      const message = `
📬 *Нове повідомлення з контактної форми Time2Fest*
━━━━━━━━━━━━━━
👤 *Ім’я:* ${data.name}
📧 *Email:* ${data.email}
💬 *Тема:* ${data.subject}
📝 *Повідомлення:*
${data.message}
━━━━━━━━━━━━━━
✅ Політика: ${data.policy ? "Погоджено" : "Не погоджено"}
`;

      await axios.post(URI_API, {
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      });

      return { success: true };
    } catch (err: any) {
      throw new HttpException(
        { success: false, error: err?.response?.data || err.message || err },
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
