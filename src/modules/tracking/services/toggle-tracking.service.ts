import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ToggleTrackingDto } from '../dto/toggle-tracking.dto';

@Injectable()
export class ToggleTrackingService {
  constructor(private prisma: PrismaService) {}

  async execute(userId: string, toggleTrackingDto: ToggleTrackingDto) {
    const { habitId, completedDate, checked } = toggleTrackingDto;
    
    const date = new Date(completedDate);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if a tracking record already exists for this habit on this date
    const existingTracking = await this.prisma.tracking.findFirst({
      where: {
        userId,
        habitId,
        completedDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existingTracking) {
      // Update existing tracking record
      const updatedTracking = await this.prisma.tracking.update({
        where: { id: existingTracking.id },
        data: { checked },
        select: {
          id: true,
          habitId: true,
          completedDate: true,
          checked: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        message: 'Tracking updated successfully',
        tracking: updatedTracking,
      };
    } else {
      // Create new tracking record
      const newTracking = await this.prisma.tracking.create({
        data: {
          userId,
          habitId,
          completedDate: date,
          checked,
        },
        select: {
          id: true,
          habitId: true,
          completedDate: true,
          checked: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        message: 'Tracking created successfully',
        tracking: newTracking,
      };
    }
  }
}

