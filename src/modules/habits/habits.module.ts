import { Module } from '@nestjs/common';
import { HabitsController } from './habits.contoller';
import { CreateHabitService } from './services/create-habit.service';
import { GetHabitsService } from './services/get-habits.service';

@Module({
  controllers: [HabitsController],
  providers: [CreateHabitService, GetHabitsService],
})
export class HabitsModule {}

