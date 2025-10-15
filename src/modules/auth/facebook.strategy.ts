import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { AuthService } from './auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL! || 'http://localhost:3000/auth/facebook/callback',
      profileFields: ['emails', 'name', 'displayName'],
      passReqToCallback: false,
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
    const { emails, displayName } = profile;
    const email = emails?.[0]?.value;

    const user = await this.authService.socialLogin({
      provider: 'facebook',
      email,
      name: displayName,
    });

    done(null, user);
  }
}
