import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export interface HabitFilters {
  userId?: string;
  id?: string;
  name?: string;
  weekDays?: number[];
  habitDay?: number; // Filter by specific day of week
  date?: Date; // For tracking status on specific date
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
  orderBy?: {
    createdAt?: 'asc' | 'desc';
    updatedAt?: 'asc' | 'desc';
    name?: 'asc' | 'desc';
  };
  include?: {
    tracking?: boolean;
    user?: boolean;
  };
}

export interface CreateHabitData {
  name: string;
  weekDays: number[];
  userId: string;
  createdAt?: Date;
}

export interface UpdateHabitData {
  name?: string;
  weekDays?: number[];
}

@Injectable()
export class HabitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: string, userId?: string) {
    const where: Prisma.HabitWhereInput = { id };
    if (userId !== undefined && userId !== null) {
      where.userId = userId;
    }

    return this.prisma.habit.findUnique({
      where: where as Prisma.HabitWhereUniqueInput,
      include: {
        Tracking: true,
        user: false,
      },
    });
  }

  async getAll(userId?: string, filters?: HabitFilters) {
    const combinedFilters: HabitFilters = {
      ...filters,
      userId: userId !== undefined ? userId : filters?.userId,
    };
    return this.findMany(combinedFilters);
  }

  async getByIdAndDate(id: string, date: Date, userId?: string) {
    const habit = await this.getById(id, userId);
    if (!habit) {
      return null;
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const tracking = await this.prisma.tracking.findFirst({
      where: {
        habitId: id,
        completedDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        ...(userId !== undefined && userId !== null ? { userId } : {}),
      },
    });

    return {
      ...habit,
      trackingForDate: tracking,
      isCompleted: tracking?.checked || false,
    };
  }

  async findMany(filters?: HabitFilters) {
    const where: Prisma.HabitWhereInput = {};

    // Apply filters only if they are provided (not null/undefined)
    if (filters?.userId !== undefined && filters.userId !== null) {
      where.userId = filters.userId;
    }

    if (filters?.id !== undefined && filters.id !== null) {
      where.id = filters.id;
    }

    if (filters?.name !== undefined && filters.name !== null) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive',
      };
    }

    if (filters?.weekDays !== undefined && filters.weekDays !== null && filters.weekDays.length > 0) {
      where.weekDays = {
        hasSome: filters.weekDays,
      };
    }

    if (filters?.habitDay !== undefined && filters.habitDay !== null) {
      where.weekDays = {
        hasSome: [filters.habitDay],
      };
    }

    if (filters?.createdAt !== undefined && filters.createdAt !== null) {
      if (filters.createdAt.gte !== undefined && filters.createdAt.gte !== null) {
        where.createdAt = {
          gte: filters.createdAt.gte,
        };
      }
      if (filters.createdAt.lte !== undefined && filters.createdAt.lte !== null) {
        where.createdAt = {
          lte: filters.createdAt.lte,
        };
      }
    }

    // Build orderBy
    const orderBy: Prisma.HabitOrderByWithRelationInput[] = [];
    if (filters?.orderBy) {
      if (filters.orderBy.createdAt) {
        orderBy.push({ createdAt: filters.orderBy.createdAt });
      }
      if (filters.orderBy.updatedAt) {
        orderBy.push({ updatedAt: filters.orderBy.updatedAt });
      }
      if (filters.orderBy.name) {
        orderBy.push({ name: filters.orderBy.name });
      }
    }
    // Default ordering if none specified
    if (orderBy.length === 0) {
      orderBy.push({ createdAt: 'desc' });
    }

    // Build include
    const include: Prisma.HabitInclude = {};
    if (filters?.include?.tracking) {
      include.Tracking = true;
    }
    if (filters?.include?.user) {
      include.user = true;
    }

    const habits = await this.prisma.habit.findMany({
      where,
      orderBy,
      include: Object.keys(include).length > 0 ? include : undefined,
    });

    // If date is provided, include tracking status for that date
    if (filters?.date !== undefined && filters.date !== null) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);

      const trackingRecords = await this.prisma.tracking.findMany({
        where: {
          habitId: { in: habits.map((h) => h.id) },
          completedDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          ...(filters.userId !== undefined && filters.userId !== null ? { userId: filters.userId } : {}),
        },
      });

      return habits.map((habit) => ({
        ...habit,
        isCompleted: trackingRecords.find((t) => t.habitId === habit.id)?.checked || false,
      }));
    }

    return habits;
  }

  async create(data: CreateHabitData) {
    return this.prisma.habit.create({
      data: {
        name: data.name,
        weekDays: data.weekDays,
        userId: data.userId,
        createdAt: data.createdAt || new Date(),
      },
      include: {
        Tracking: true,
      },
    });
  }

  async update(id: string, data: UpdateHabitData, userId?: string) {
    const where: Prisma.HabitWhereUniqueInput = { id };
    if (userId !== undefined && userId !== null) {
      // For update, we need to check ownership first
      const habit = await this.getById(id, userId);
      if (!habit) {
        throw new Error('Habit not found or access denied');
      }
    }

    return this.prisma.habit.update({
      where,
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.weekDays !== undefined ? { weekDays: data.weekDays } : {}),
      },
      include: {
        Tracking: true,
      },
    });
  }

  async delete(id: string, userId?: string) {
    const where: Prisma.HabitWhereUniqueInput = { id };
    if (userId !== undefined && userId !== null) {
      // For delete, we need to check ownership first
      const habit = await this.getById(id, userId);
      if (!habit) {
        throw new Error('Habit not found or access denied');
      }
    }

    return this.prisma.habit.delete({
      where,
    });
  }
}
