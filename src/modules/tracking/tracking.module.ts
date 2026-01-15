import { Module } from '@nestjs/common';
import { TrackingController } from './tracking.contoller';
import { ToggleTrackingService } from './services/toggle-tracking.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TrackingController],
  providers: [ToggleTrackingService],
})
export class TrackingModule {}

