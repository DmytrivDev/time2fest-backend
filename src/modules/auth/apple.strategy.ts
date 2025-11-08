import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';
import { AuthService } from './auth.service';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.APPLE_CLIENT_ID!,
      teamID: process.env.APPLE_TEAM_ID!,
      keyID: process.env.APPLE_KEY_ID!,
      privateKeyString: process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      callbackURL: process.env.APPLE_CALLBACK_URL!,
      scope: ['name', 'email'],
      passReqToCallback: false,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ): Promise<any> {
    try {
      const email =
        profile?.email ||
        (profile?._json && profile._json.email) ||
        profile?.user?.email;
      const name =
        profile?.name?.firstName ||
        profile?.displayName ||
        email?.split('@')[0] ||
        'AppleUser';

      const user = await this.authService.socialLogin({
        provider: 'apple',
        email,
        name,
      });

      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }
}
