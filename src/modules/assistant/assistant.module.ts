import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AssistantController } from './assistant.controller';
import { AssistantRepository } from './repositories/assistant.repository';
import { ChatService } from './services/chat.service';
import GetChatHistoryService from './services/get-chat-history';
import { HabitsModule } from '../habits/habits.module';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [PrismaModule, HabitsModule, TrackingModule],
  controllers: [AssistantController],
  providers: [AssistantRepository, ChatService, GetChatHistoryService],
  exports: [AssistantRepository],
})
export class AssistantModule {}
