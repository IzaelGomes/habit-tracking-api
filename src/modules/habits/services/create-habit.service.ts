import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateHabitDto } from '../dto/create-habit.dto';

@Injectable()
export class CreateHabitService {
  constructor(private prisma: PrismaService) {}

  async execute(userId: string, createHabitDto: CreateHabitDto) {
    const { name, weekDays, createdAt } = createHabitDto;

    // Validate that weekDays are unique
    const uniqueWeekDays = [...new Set(weekDays)];
    if (uniqueWeekDays.length !== weekDays.length) {
      throw new BadRequestException('Weekdays must be unique');
    }

    // Sort weekDays for consistent storage
    const sortedWeekDays = uniqueWeekDays.sort((a, b) => a - b);

    // Create habit
    const habit = await this.prisma.habit.create({
      data: {
        name,
        weekDays: sortedWeekDays,
        userId,
        createdAt,
      },
      select: {
        id: true,
        name: true,
        weekDays: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Habit created successfully',
      habit,
    };
  }
}

