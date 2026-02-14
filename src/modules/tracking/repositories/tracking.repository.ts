import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export interface TrackingFilters {
  userId?: string;
  id?: string;
  habitId?: string;
  checked?: boolean;
  completedDate?: {
    gte?: Date;
    lte?: Date;
    equals?: Date;
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
  orderBy?: {
    completedDate?: 'asc' | 'desc';
    createdAt?: 'asc' | 'desc';
  };
  include?: {
    habit?: boolean;
    user?: boolean;
  };
}

export interface CreateTrackingData {
  userId: string;
  habitId: string;
  completedDate: Date;
  checked: boolean;
}

export interface UpdateTrackingData {
  checked?: boolean;
  completedDate?: Date;
}

@Injectable()
export class TrackingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: string, userId?: string) {
    const where: Prisma.TrackingWhereInput = { id };
    if (userId !== undefined && userId !== null) {
      where.userId = userId;
    }

    return this.prisma.tracking.findFirst({
      where,
      include: {
        habit: true,
        user: false,
      },
    });
  }

  async getAll(userId?: string, filters?: TrackingFilters) {
    const combinedFilters: TrackingFilters = {
      ...filters,
      userId: userId !== undefined ? userId : filters?.userId,
    };
    return this.findMany(combinedFilters);
  }

  async getByIdAndDate(habitId: string, date: Date, userId?: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const where: Prisma.TrackingWhereInput = {
      habitId,
      completedDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (userId !== undefined && userId !== null) {
      where.userId = userId;
    }

    return this.prisma.tracking.findFirst({
      where,
      include: {
        habit: true,
        user: false,
      },
    });
  }

  async findMany(filters?: TrackingFilters) {
    const where: Prisma.TrackingWhereInput = {};

    // Apply filters only if they are provided (not null/undefined)
    if (filters?.userId !== undefined && filters.userId !== null) {
      where.userId = filters.userId;
    }

    if (filters?.id !== undefined && filters.id !== null) {
      where.id = filters.id;
    }

    if (filters?.habitId !== undefined && filters.habitId !== null) {
      where.habitId = filters.habitId;
    }

    if (filters?.checked !== undefined && filters.checked !== null) {
      where.checked = filters.checked;
    }

    if (filters?.completedDate !== undefined && filters.completedDate !== null) {
      const dateFilter: Prisma.DateTimeFilter = {};

      if (filters.completedDate.gte !== undefined && filters.completedDate.gte !== null) {
        dateFilter.gte = filters.completedDate.gte;
      }

      if (filters.completedDate.lte !== undefined && filters.completedDate.lte !== null) {
        dateFilter.lte = filters.completedDate.lte;
      }

      if (filters.completedDate.equals !== undefined && filters.completedDate.equals !== null) {
        dateFilter.equals = filters.completedDate.equals;
      }

      if (Object.keys(dateFilter).length > 0) {
        where.completedDate = dateFilter;
      }
    }

    // Handle dateRange filter
    if (filters?.dateRange !== undefined && filters.dateRange !== null) {
      where.completedDate = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    // Build orderBy
    const orderBy: Prisma.TrackingOrderByWithRelationInput[] = [];
    if (filters?.orderBy) {
      if (filters.orderBy.completedDate) {
        orderBy.push({ completedDate: filters.orderBy.completedDate });
      }
      if (filters.orderBy.createdAt) {
        orderBy.push({ createdAt: filters.orderBy.createdAt });
      }
    }
    // Default ordering if none specified
    if (orderBy.length === 0) {
      orderBy.push({ completedDate: 'desc' });
    }

    // Build include
    const include: Prisma.TrackingInclude = {};
    if (filters?.include?.habit) {
      include.habit = true;
    }
    if (filters?.include?.user) {
      include.user = true;
    }

    return this.prisma.tracking.findMany({
      where,
      orderBy,
      include: Object.keys(include).length > 0 ? include : undefined,
    });
  }

  async create(data: CreateTrackingData) {
    return this.prisma.tracking.create({
      data: {
        userId: data.userId,
        habitId: data.habitId,
        completedDate: data.completedDate,
        checked: data.checked,
      },
      include: {
        habit: true,
      },
    });
  }

  async update(id: string, data: UpdateTrackingData, userId?: string) {
    const where: Prisma.TrackingWhereUniqueInput = { id };
    if (userId !== undefined && userId !== null) {
      // For update, we need to check ownership first
      const tracking = await this.getById(id, userId);
      if (!tracking) {
        throw new Error('Tracking not found or access denied');
      }
    }

    return this.prisma.tracking.update({
      where,
      data: {
        ...(data.checked !== undefined ? { checked: data.checked } : {}),
        ...(data.completedDate !== undefined ? { completedDate: data.completedDate } : {}),
      },
      include: {
        habit: true,
      },
    });
  }

  async delete(id: string, userId?: string) {
    const where: Prisma.TrackingWhereUniqueInput = { id };
    if (userId !== undefined && userId !== null) {
      // For delete, we need to check ownership first
      const tracking = await this.getById(id, userId);
      if (!tracking) {
        throw new Error('Tracking not found or access denied');
      }
    }

    return this.prisma.tracking.delete({
      where,
    });
  }
}
