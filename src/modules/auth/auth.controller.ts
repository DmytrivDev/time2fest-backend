import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto } from "./dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AuthGuard } from "@nestjs/passport";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // --- 🔹 Реєстрація ---
  @Post("register")
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto);
    const tokens = await this.authService.generateTokens(user as any);
    return { ...user, ...tokens };
  }

  // --- 🔹 Логін ---
  @Post("login")
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.login(dto);
    const tokens = await this.authService.generateTokens(user as any);
    return { ...user, ...tokens };
  }

  // --- 🔹 Профіль ---
  @UseGuards(JwtAuthGuard)
  @Get("profile")
  getProfile(@Req() req: any) {
    const { password, refreshToken, ...safeUser } = req.user;
    return safeUser;
  }

  @Post("google")
  async googleLogin(@Body("idToken") idToken: string) {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    // 🔹 Валідуємо idToken
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;
    const name = payload?.name || email?.split("@")[0];

    if (!email) {
      throw new Error("Email not found in Google token");
    }

    // 🔹 1. Отримуємо або створюємо користувача
    const user = await this.authService.socialLogin({
      provider: "google",
      email,
      name,
    });

    // 🔹 2. Генеруємо токени
    const tokens = await this.authService.generateTokens(user as any);

    // 🔹 3. Повертаємо все разом
    return { ...user, ...tokens };
  }

  // --- 🔹 Facebook Login Redirect ---
  @Get("facebook")
  @UseGuards(AuthGuard("facebook"))
  async facebookLogin() {
    // Це просто редирект до Facebook OAuth
  }

  // --- 🔹 Facebook Callback ---
  @Get("facebook/callback")
  @UseGuards(AuthGuard("facebook"))
  async facebookCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;

    // Створюємо токени
    const tokens = await this.authService.generateTokens(user);

    // 🔁 Редиректимо користувача назад на фронт з токенами
    const redirectUrl = new URL("https://time2fest.com/login-success");
    redirectUrl.searchParams.set("accessToken", tokens.accessToken);
    redirectUrl.searchParams.set("refreshToken", tokens.refreshToken);

    return res.redirect(redirectUrl.toString());
  }

  // --- 🔹 Refresh токен ---
  @Post("refresh")
  async refresh(@Body("refreshToken") token: string) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await this.authService.validateUser(payload.id);

      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      const match = await bcrypt.compare(token, user.refreshToken || "");
      if (!match) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      return this.authService.generateTokens(user);
    } catch (err) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }
}
