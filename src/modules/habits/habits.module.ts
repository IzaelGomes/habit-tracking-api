import { Module } from '@nestjs/common';
import { HabitsController } from './habits.contoller';
import { CreateHabitService } from './services/create-habit.service';
import { GetHabitsService } from './services/get-habits.service';
import { HabitsRepository } from './repositories/habits.repository';

@Module({
  controllers: [HabitsController],
  providers: [CreateHabitService, GetHabitsService, HabitsRepository],
  exports: [HabitsRepository],
})
export class HabitsModule {}

