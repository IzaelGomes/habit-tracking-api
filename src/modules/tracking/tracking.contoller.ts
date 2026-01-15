import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ToggleTrackingService } from './services/toggle-tracking.service';
import { ToggleTrackingDto } from './dto/toggle-tracking.dto';

@Controller('tracking')
@UseGuards(JwtAuthGuard)
export class TrackingController {
  constructor(
    private readonly toggleTrackingService: ToggleTrackingService,
  ) {}

  @Post()
  async toggleTracking(@Request() req, @Body() toggleTrackingDto: ToggleTrackingDto) {
    const userId = req.user.userId;
    return this.toggleTrackingService.execute(userId, toggleTrackingDto);
  }
}

