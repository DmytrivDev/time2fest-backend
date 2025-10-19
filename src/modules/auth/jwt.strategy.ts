import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "./auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: any) {
    // payload має вигляд { id, email }
    const user = await this.authService.validateUser(payload.id);

    if (!user) {
      throw new UnauthorizedException("User not found or inactive");
    }

    // 🔹 Повертаємо лише безпечні поля
    return {
      id: user.id,
      name: user.name || "",
      email: user.email || "",
    };
  }
}
