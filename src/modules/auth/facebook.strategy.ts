import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-facebook";
import { AuthService } from "./auth.service";

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, "facebook") {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL!,
      profileFields: ["emails", "name", "displayName"],
      passReqToCallback: true, // 👈 дає доступ до req.query.state
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function
  ) {
    const { emails, displayName } = profile;
    const email = emails?.[0]?.value;

    const user: any = await this.authService.socialLogin({
      provider: "facebook",
      email,
      name: displayName,
    });

    // Зчитуємо мову зі state
    user.lang = req.query.state || "en";

    done(null, user);
  }
}