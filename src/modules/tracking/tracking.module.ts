import { Module } from '@nestjs/common';
import { TrackingController } from './tracking.contoller';
import { ToggleTrackingService } from './services/toggle-tracking.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { TrackingRepository } from './repositories/tracking.repository';

@Module({
  imports: [PrismaModule],
  controllers: [TrackingController],
  providers: [ToggleTrackingService, TrackingRepository],
  exports: [TrackingRepository],
})
export class TrackingModule {}

