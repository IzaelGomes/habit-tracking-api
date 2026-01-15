import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { HabitsModule } from './modules/habits/habits.module';
import { TrackingModule } from './modules/tracking/tracking.module';

@Module({
  imports: [PrismaModule, AuthModule, HabitsModule, TrackingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
