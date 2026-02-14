import { Injectable } from '@nestjs/common';
import { AssistantRepository } from '../repositories/assistant.repository';

@Injectable()
class GetChatHistoryService {
  constructor(private readonly assistantRepository: AssistantRepository) {}

  async execute(userId: string) {
    return this.assistantRepository.findMessagesByUserId(userId);
  }
}

export default GetChatHistoryService;
