import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { AuthService } from "./auth.service";
import { Request } from "express";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL! ||
        "http://localhost:3000/api/auth/google/callback",
      scope: ["email", "profile"],
      passReqToCallback: true, // ✅ дозволяє отримати req
    });
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback
  ): Promise<any> {
    const { emails, displayName } = profile;
    const email = emails?.[0]?.value;

    // 🔹 Отримуємо параметр мови з URL
    const lang = (req.query.lang as string) || "en";

    // 🔹 Авторизація / створення користувача
    const user = await this.authService.socialLogin({
      provider: "google",
      email,
      name: displayName,
    });

    // 🔹 Додаємо мову до користувача (щоб передати далі у контролер)
    (user as any).lang = lang;

    done(null, user);
  }
}
