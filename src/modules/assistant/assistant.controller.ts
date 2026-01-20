import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './services/chat.service';
import { ChatDto } from './dto/chat.dto';
import GetChatHistoryService from './services/get-chat-history';

@Controller('assistant')
@UseGuards(JwtAuthGuard)
export class AssistantController {
  constructor(private readonly chatService: ChatService, private readonly getChatHistoryService: GetChatHistoryService) {}

  @Post()
  async chat(@Request() req, @Body() chatDto: ChatDto) {
    const userId = req.user.userId;
    return this.chatService.execute(userId, chatDto);
  }

  @Get('history')
  async getChatHistory(@Request() req) {
    const userId = req.user.userId;
    return this.getChatHistoryService.execute(userId);
  }
}
