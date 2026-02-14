import { Injectable, BadRequestException } from '@nestjs/common';
import { HabitsRepository } from '../repositories/habits.repository';
import { CreateHabitDto } from '../dto/create-habit.dto';

@Injectable()
export class CreateHabitService {
  constructor(private habitsRepository: HabitsRepository) {}

  async execute(userId: string, createHabitDto: CreateHabitDto) {
    const { name, weekDays, createdAt } = createHabitDto;

    // Validate that weekDays are unique
    const uniqueWeekDays = [...new Set(weekDays)];
    if (uniqueWeekDays.length !== weekDays.length) {
      throw new BadRequestException('Weekdays must be unique');
    }

    // Sort weekDays for consistent storage
    const sortedWeekDays = uniqueWeekDays.sort((a, b) => a - b);

    const habit = await this.habitsRepository.create({
      name,
      weekDays: sortedWeekDays,
      userId,
      createdAt: createdAt ? new Date(createdAt) : undefined,
    });

    return {
      message: 'Habit created successfully',
      habit: {
        id: habit.id,
        name: habit.name,
        weekDays: habit.weekDays,
        createdAt: habit.createdAt,
        updatedAt: habit.updatedAt,
      },
    };
  }
}
