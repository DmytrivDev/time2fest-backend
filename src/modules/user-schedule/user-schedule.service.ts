import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSchedule } from './user-schedule.entity';

@Injectable()
export class UserScheduleService {
  constructor(
    @InjectRepository(UserSchedule)
    private readonly repo: Repository<UserSchedule>,
  ) {}

  async getByUser(userId: string) {
    const schedule = await this.repo.findOne({ where: { user_id: userId } });
    return schedule || { countries: [] };
  }

  async update(userId: string, countries: any[]) {
    const existing = await this.repo.findOne({ where: { user_id: userId } });

    if (existing) {
      existing.countries = countries;
      await this.repo.save(existing);
      return { success: true, countries };
    }

    // якщо запису ще немає — створюємо новий
    const created = this.repo.create({ user_id: userId, countries });
    await this.repo.save(created);
    return { success: true, countries };
  }
}
