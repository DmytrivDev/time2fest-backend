import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { User } from "./user.entity";
import { RegisterDto, LoginDto } from "./dto";
import * as jwt from "jsonwebtoken";
import * as crypto from "crypto";
import * as nodemailer from "nodemailer";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService
  ) {}

  async register(dto: RegisterDto) {
    const { email, password, name } = dto;

    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException("Email already in use");
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ email, password: hashed, name });
    await this.userRepo.save(user);

    const token = this.jwtService.sign({ id: user.id, email: user.email });

    return { id: user.id, email: user.email, name: user.name, token };
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException("Invalid credentials");

    const token = this.jwtService.sign({ id: user.id, email: user.email });

    return { id: user.id, email: user.email, name: user.name, token };
  }

  async socialLogin(data: { provider: string; email: string; name?: string }) {
    if (!data.email)
      throw new BadRequestException("Email not provided by provider");

    let user = await this.userRepo.findOne({ where: { email: data.email } });

    if (!user) {
      user = this.userRepo.create({
        email: data.email,
        name: data.name || data.email.split("@")[0],
        password: "", // соцлогіни без пароля
      });
      await this.userRepo.save(user);
    }

    const token = this.jwtService.sign({ id: user.id, email: user.email });
    return { id: user.id, email: user.email, name: user.name, token };
  }

  async validateToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || "superSecretKey123",
      });
      return this.validateUser(payload.id);
    } catch (err) {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  async generateTokens(user: User) {
    const accessToken = this.jwtService.sign(
      { id: user.id, email: user.email },
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "30d",
    });

    // Оновлюємо refreshToken тільки при генерації
    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepo.save(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async validateUser(id: number) {
    return this.userRepo.findOne({ where: { id } });
  }

  async forgotPassword(email: string, locale = "en") {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      throw new BadRequestException("User not found");
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 година

    user.resetToken = token;
    user.resetTokenExpires = expires;
    await this.userRepo.save(user);

    const baseUrl = process.env.FRONTEND_URL || "https://time2fest.com";
    const langPrefix = locale && locale !== "en" ? `/${locale}` : "";
    const link = `${baseUrl}${langPrefix}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port: +process.env.SMTP_PORT!,
      secure: false,
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });

    await transporter.sendMail({
      from: `"Time2Fest" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Password Reset",
      html: `
        <h2>Password reset request</h2>
        <p>Click below to reset your password:</p>
        <a href="${link}" target="_blank" style="color:#f94a51; font-weight:bold;">Reset password</a>
        <p>This link will expire in 1 hour.</p>
      `,
    });

    return { message: "Password reset link sent." };
  }

  // ---- Скидання паролю ----
  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { resetToken: token } });

    if (
      !user ||
      !user.resetTokenExpires ||
      user.resetTokenExpires < new Date()
    ) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpires = null;

    await this.userRepo.save(user);
    return { message: "Password successfully updated." };
  }
}
