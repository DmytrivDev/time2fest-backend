import { Injectable, InternalServerErrorException } from "@nestjs/common";
import axios from "axios";
import * as crypto from "crypto";
import { UserService } from "../user/user.service";

@Injectable()
export class PaymentsService {
  constructor(private readonly usersService: UserService) {}

  private readonly api = axios.create({
    baseURL: "https://sandbox-api.paddle.com",
    headers: {
      Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  // ───────────────────────────────────────────────
  // CREATE CHECKOUT SESSION
  // ───────────────────────────────────────────────
  async createCheckout(email: string) {
    const priceId = process.env.PADDLE_PRICE_ID;

    if (!process.env.PADDLE_API_KEY) {
      throw new InternalServerErrorException("PADDLE_API_KEY missing");
    }
    if (!priceId) {
      throw new InternalServerErrorException("PADDLE_PRICE_ID missing");
    }

    try {
      const response = await this.api.post("/checkout/sessions", {
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
      });

      return response.data.data;
    } catch (error: any) {
      console.error(
        "❌ Checkout error:",
        error.response?.data || error.message
      );
      throw new InternalServerErrorException(
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
    const secret = process.env.PADDLE_WEBHOOK_SECRET;

    if (!secret) {
      console.error("❌ Missing PADDLE_WEBHOOK_SECRET");
      return false;
    }

    // 1. Перевіряємо часовий штамп (5 хв максимум)
    const ts = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);

    if (Math.abs(now - ts) > 300) {
      console.error("❌ Webhook timestamp too old");
      return false;
    }

    // 2. HMAC check
    const hmac = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

    return hmac === signature;
  }

  // ───────────────────────────────────────────────
  // HANDLE PADDLE EVENT
  // ───────────────────────────────────────────────
  async handlePaddleEvent(event: any) {
    console.log("📩 Paddle event:", event.event_type);

    switch (event.event_type) {
      case "transaction.completed": {
        const email = event.data.customer?.email;
        if (email) {
          console.log("🎉 Activating premium for:", email);
          await this.usersService.setPremium(email);
        }
        break;
      }

      case "subscription.canceled": {
        const email = event.data.customer?.email;
        if (email) {
          console.log("⚠️ Subscription cancelled:", email);
        }
        break;
      }

      case "subscription.updated": {
        console.log("🔄 Subscription updated");
        break;
      }

      default:
        console.log("ℹ Unhandled event:", event.event_type);
    }
  }
}
