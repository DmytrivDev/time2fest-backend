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
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "./dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AuthGuard } from "@nestjs/passport";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 🔹 Звичайна реєстрація
  @Post("register")
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto);
    const tokens = await this.authService.generateTokens(user as any);
    return { ...user, ...tokens };
  }

  // 🔹 Логін
  @Post("login")
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.login(dto);
    const tokens = await this.authService.generateTokens(user as any);
    return { ...user, ...tokens };
  }

  // 🔹 Профіль користувача
  @UseGuards(JwtAuthGuard)
  @Get("profile")
  getProfile(@Req() req: any) {
    const { password, refreshToken, ...safeUser } = req.user;
    return safeUser;
  }

  // 🔹 Google OAuth Redirect
  @Get("google")
  @UseGuards(AuthGuard("google"))
  async googleAuth() {
    // Redirect to Google login
  }

  // 🔹 Google OAuth Callback
  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const tokens = await this.authService.generateTokens(user);

    // ✅ Єдиний універсальний шлях
    const redirectUrl = new URL("https://time2fest.com/login-success");
    redirectUrl.searchParams.set("accessToken", tokens.accessToken);
    redirectUrl.searchParams.set("refreshToken", tokens.refreshToken);

    return res.redirect(redirectUrl.toString());
  }

  // 🔹 Facebook OAuth Redirect
  @Get("facebook")
  @UseGuards(AuthGuard("facebook"))
  async facebookLogin() {}

  // 🔹 Facebook Callback
  @Get("facebook/callback")
  @UseGuards(AuthGuard("facebook"))
  async facebookCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const tokens = await this.authService.generateTokens(user);

    const redirectUrl = new URL("https://time2fest.com/login-success");
    redirectUrl.searchParams.set("accessToken", tokens.accessToken);
    redirectUrl.searchParams.set("refreshToken", tokens.refreshToken);

    return res.redirect(redirectUrl.toString());
  }

  // 🔹 Оновлення токена
  @Post("refresh")
  async refresh(@Body("refreshToken") token: string) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await this.authService.validateUser(payload.id);

      if (!user) throw new UnauthorizedException("User not found");

      const match = await bcrypt.compare(token, user.refreshToken || "");
      if (!match) throw new UnauthorizedException("Invalid refresh token");

      return this.authService.generateTokens(user);
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }

  @Post("forgot-password")
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post("reset-password")
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }
}
