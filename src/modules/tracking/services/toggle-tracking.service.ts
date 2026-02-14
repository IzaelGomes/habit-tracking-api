import { Injectable } from '@nestjs/common';
import { TrackingRepository } from '../repositories/tracking.repository';
import { ToggleTrackingDto } from '../dto/toggle-tracking.dto';

@Injectable()
export class ToggleTrackingService {
  constructor(private trackingRepository: TrackingRepository) {}

  async execute(userId: string, toggleTrackingDto: ToggleTrackingDto) {
    const { habitId, completedDate, checked } = toggleTrackingDto;

    const date = new Date(completedDate);

    const existingTracking = await this.trackingRepository.getByIdAndDate(
      habitId,
      date,
      userId,
    );

    if (existingTracking) {
      const updated = await this.trackingRepository.update(
        existingTracking.id,
        { checked },
        userId,
      );

      return {
        message: 'Tracking updated successfully',
        tracking: {
          id: updated.id,
          habitId: updated.habitId,
          completedDate: updated.completedDate,
          checked: updated.checked,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        },
      };
    }

    const created = await this.trackingRepository.create({
      userId,
      habitId,
      completedDate: date,
      checked,
    });

    return {
      message: 'Tracking created successfully',
      tracking: {
        id: created.id,
        habitId: created.habitId,
        completedDate: created.completedDate,
        checked: created.checked,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      },
    };
  }
}
