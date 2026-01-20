import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { HabitsModule } from './modules/habits/habits.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { AssistantModule } from './modules/assistant/assistant.module';

@Module({
  imports: [PrismaModule, AuthModule, HabitsModule, TrackingModule, AssistantModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
