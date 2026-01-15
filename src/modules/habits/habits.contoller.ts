import { Controller, Post, Get, Body, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateHabitService } from './services/create-habit.service';
import { GetHabitsService } from './services/get-habits.service';
import { CreateHabitDto } from './dto/create-habit.dto';

@Controller('habits')
@UseGuards(JwtAuthGuard)
export class HabitsController {
  constructor(
    private readonly createHabitService: CreateHabitService,
    private readonly getHabitsService: GetHabitsService,
  ) {}

  @Post()
  async createHabit(@Request() req, @Body() createHabitDto: CreateHabitDto) {
    const userId = req.user.userId;
    return this.createHabitService.execute(userId, createHabitDto);
  }

  @Get()
  async getHabits(@Request() req, @Query('date') dateStr?: string) {
    const userId = req.user.userId;
    
    let habitDay: number | undefined;
    let date: Date | undefined;
    
    if (dateStr) {
      date = new Date(dateStr);
      // Get day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
      const jsDay = date.getDay();
      habitDay = jsDay
    }
    
    return this.getHabitsService.execute(userId, habitDay, date);
  }
}

