import { Injectable } from '@nestjs/common';
import { HabitsRepository } from '../repositories/habits.repository';

@Injectable()
export class GetHabitsService {
  constructor(private habitsRepository: HabitsRepository) {}

  async execute(userId: string, habitDay?: number, date?: Date) {
    const habits = await this.habitsRepository.findMany({
      userId,
      habitDay,
      date,
      orderBy: { createdAt: 'desc' },
    });

    return {
      habits,
      total: habits.length,
    };
  }
}
