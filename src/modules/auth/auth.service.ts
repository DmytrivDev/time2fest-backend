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

  async validateUser(id: number) {
    return this.userRepo.findOne({ where: { id } });
  }
}
