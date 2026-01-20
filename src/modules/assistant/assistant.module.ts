import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AssistantController } from './assistant.controller';
import { ChatService } from './services/chat.service';
import GetChatHistoryService from './services/get-chat-history';

@Module({
  imports: [PrismaModule],
  controllers: [AssistantController],
  providers: [ChatService, GetChatHistoryService],
})
export class AssistantModule {}
