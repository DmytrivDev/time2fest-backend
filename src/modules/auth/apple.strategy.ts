import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
import * as appleSignin from 'apple-signin-auth';

@Injectable()
export class AppleStrategy {
  constructor(private readonly authService: AuthService) {}

  async validate(idToken: string) {
    const decoded = await appleSignin.verifyIdToken(idToken, {
      audience: process.env.APPLE_CLIENT_ID!,
      ignoreExpiration: false,
    });

    const { email } = decoded;
    const user = await this.authService.socialLogin({
      provider: 'apple',
      email,
      name: email.split('@')[0],
    });

    return user;
  }
}
