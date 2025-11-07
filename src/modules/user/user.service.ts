import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import * as bcrypt from "bcrypt";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  // --- Зміна імені або налаштувань профілю ---
  async updateProfile(userId: number, dto: UpdateProfileDto) {
    if (!userId) throw new NotFoundException("User not found");

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    // 🔹 Якщо передано name
    if (dto.name !== undefined) {
      const trimmed = dto.name.trim();
      if (!trimmed) throw new BadRequestException("Name cannot be empty");
      user.name = trimmed;
    }

    // 🔹 Якщо передано newsletter
    if (dto.newsletter !== undefined) {
      user.newsletter = dto.newsletter;
    }

    await this.userRepository.save(user);

    return {
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        newsletter: user.newsletter,
      },
    };
  }

  // --- Зміна пароля ---
  async changePassword(userId: number, dto: ChangePasswordDto) {
    if (!userId) throw new NotFoundException("User not found");

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    // 🔹 Перевіряємо поточний пароль
    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException("Invalid current password");
    }

    // 🔹 Хешуємо новий пароль
    const hashed = await bcrypt.hash(dto.newPassword, 10);
    user.password = hashed;

    await this.userRepository.save(user);

    return {
      success: true,
      message: "Password changed successfully",
    };
  }
}
