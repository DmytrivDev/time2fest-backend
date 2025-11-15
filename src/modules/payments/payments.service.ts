import { Injectable, InternalServerErrorException } from "@nestjs/common";
import axios from "axios";
import * as crypto from "crypto";
import { UserService } from "../user/user.service";

@Injectable()
export class PaymentsService {
  constructor(private readonly usersService: UserService) {
    console.log("🟡 Loaded ENV:");
    console.log(
      "PADDLE_API_KEY:",
      process.env.PADDLE_API_KEY?.slice(0, 10) + "..."
    );
    console.log("PADDLE_PRICE_ID:", process.env.PADDLE_PRICE_ID);
    console.log(
      "PADDLE_WEBHOOK_SECRET:",
      process.env.PADDLE_WEBHOOK_SECRET?.slice(0, 6) + "..."
    );
  }

  private readonly api = axios.create({
    baseURL: "https://sandbox-api.paddle.com", // ✔ PRODUCTION URL
    headers: {
      Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  // ───────────────────────────────────────────────
  // CREATE CHECKOUT SESSION (Paddle 2.0)
  // ───────────────────────────────────────────────
  async createCheckout(email: string) {
    const priceId = process.env.PADDLE_PRICE_ID;

    console.log("➡️ [CHECKOUT] Creating checkout for:", email);
    console.log("➡️ Using price_id:", priceId);
    console.log("➡️ BASE URL:", this.api.defaults.baseURL);

    const body = {
      items: [
        {
          price_id: priceId,
          quantity: 1,
        },
      ],
      customer: {
        email,
      },
      success_url: "https://time2fest.com/payment/success",
      cancel_url: "https://time2fest.com/payment/cancel",
    };

    console.log("📤 FULL REQUEST BODY:", JSON.stringify(body, null, 2));

    try {
      const response = await this.api.post("/checkout/sessions", body);

      console.log("✔️ Paddle response:", response.data);

      return response.data.data;
    } catch (error: any) {
      console.error("❌ [CHECKOUT ERROR]: FULL DUMP ↓↓↓");
      console.error("➡️ Config URL:", error.config?.url);
      console.error("➡️ Request data:", error.config?.data);
      console.error("➡️ Paddle response:", error.response?.data);
      console.error("➡️ Status:", error.response?.status);
      console.error("➡️ Error message:", error.message);

      throw new InternalServerErrorException(
        error.response?.data?.error?.detail ||
          "Failed to create checkout session"
      );
    }
  }

  // ───────────────────────────────────────────────
  // VERIFY WEBHOOK SIGNATURE (HMAC SHA256)
  // ───────────────────────────────────────────────
  verifyWebhookSignature(
    rawBody: string,
    signature: string,
    timestamp: string
  ) {
    console.log("🟡 [WEBHOOK] Verifying signature...");

    const secret = process.env.PADDLE_WEBHOOK_SECRET;

    if (!secret) {
      console.error("❌ Missing webhook secret");
      return false;
    }

    const ts = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    console.log("⏱ Timestamp difference:", now - ts);

    if (Math.abs(now - ts) > 300) {
      console.error("❌ Timestamp too old");
      return false;
    }

    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

    console.log("🔍 Expected:", expected);
    console.log("🔍 Received:", signature);

    const valid = expected === signature;
    console.log("🔍 Signature match:", valid);

    return valid;
  }

  // ───────────────────────────────────────────────
  // HANDLE EVENTS
  // ───────────────────────────────────────────────
  async handlePaddleEvent(event: any) {
    console.log("📩 [WEBHOOK EVENT]:", event.event_type);

    switch (event.event_type) {
      case "transaction.completed":
        const email = event.data.customer?.email;
        console.log("🎉 Activating premium for:", email);
        if (email) await this.usersService.setPremium(email);
        break;

      default:
        console.log("ℹ Unhandled event:", event.event_type);
    }
  }
}
