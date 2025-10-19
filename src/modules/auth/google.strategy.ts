import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      scope: ['email', 'profile'],
      passReqToCallback: true, // 👈 дає доступ до req.query.state
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ) {
    const { emails, displayName } = profile;
    const email = emails?.[0]?.value;

    // 👇 user каститься до any, бо ми додаємо тимчасове поле lang
    const user: any = await this.authService.socialLogin({
      provider: 'google',
      email,
      name: displayName,
    });

    // Зберігаємо мову, передану в параметрі state
    user.lang = req.query.state || 'en';

    done(null, user);
  }
}
