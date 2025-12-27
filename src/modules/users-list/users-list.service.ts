import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../user/entities/user.entity";

@Injectable()
export class UsersListService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async getUsers(paid?: string) {
    const where: Record<string, any> = {};

    if (paid === "true") {
      where.isPremium = true;
    }

    if (paid === "false") {
      where.isPremium = false;
    }

    const users = await this.userRepository.find({
      where,
      select: ["name", "email", "isPremium"],
      order: { id: "DESC" },
    });

    return {
      success: true,
      count: users.length,
      users,
    };
  }
}
