import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class GetHabitsService {
  constructor(private prisma: PrismaService) {}

  async execute(userId: string, habitDay?: number, date?: Date) {
    const habits = await this.prisma.habit.findMany({
      where: {
        userId,
        weekDays: habitDay !== undefined ? {
          hasSome: [habitDay],
        } : undefined,
      },
      select: {
        id: true,
        name: true,
        weekDays: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    // If a date is provided, include tracking status for that date
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const trackingRecords = await this.prisma.tracking.findMany({
        where: {
          userId,
          habitId: { in: habits.map(h => h.id) },
          completedDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      const habitsWithStatus = habits.map(habit => ({
        ...habit,
        isCompleted: trackingRecords.find(t => t.habitId === habit.id)?.checked || false,
      }));

      return {
        habits: habitsWithStatus,
        total: habitsWithStatus.length,
      };
    }

    return {
      habits,
      total: habits.length,
    };
  }
}

