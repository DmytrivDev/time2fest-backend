import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserSchedule } from "./user-schedule.entity";

@Injectable()
export class UserScheduleService {
  constructor(
    @InjectRepository(UserSchedule)
    private readonly repo: Repository<UserSchedule>
  ) {}

  async getByUser(userId: string) {
    let schedule = await this.repo.findOne({ where: { user_id: userId } });

    // Якщо запис ще не створений — створюємо його
    if (!schedule) {
      schedule = this.repo.create({ user_id: userId, countries: [] });
      await this.repo.save(schedule);
    }

    return schedule;
  }

  async update(userId: string, countries: any[]) {
    let schedule = await this.repo.findOne({ where: { user_id: userId } });

    if (!schedule) {
      schedule = this.repo.create({ user_id: userId, countries });
    } else {
      schedule.countries = countries;
    }

    await this.repo.save(schedule);
    return schedule;
  }
}
