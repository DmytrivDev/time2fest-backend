import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-facebook";
import { AuthService } from "./auth.service";
import { Request } from "express";

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, "facebook") {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
      callbackURL:
        process.env.FACEBOOK_CALLBACK_URL! ||
        "http://localhost:3000/api/auth/facebook/callback",
      profileFields: ["id", "emails", "name", "displayName"],
      scope: ["email"],
      passReqToCallback: true, // ✅ додаємо, щоб отримати req
    });
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function
  ) {
    const { emails, displayName } = profile;
    const email = emails?.[0]?.value;

    // 🔹 Отримуємо параметр мови з URL
    const lang = (req.query.lang as string) || "en";

    // 🔹 Створюємо або знаходимо користувача
    const user = await this.authService.socialLogin({
      provider: "facebook",
      email,
      name: displayName,
    });

    // 🔹 Додаємо мову, щоб контролер міг зробити редирект у правильну локаль
    (user as any).lang = lang;

    done(null, user);
  }
}
