import { Injectable } from '@nestjs/common';
import { MessageRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AssistantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findThreadByUserId(userId: string) {
    return this.prisma.assistantThread.findUnique({
      where: { userId },
    });
  }

  async getOrCreateThread(userId: string) {
    let thread = await this.findThreadByUserId(userId);
    if (!thread) {
      thread = await this.prisma.assistantThread.create({
        data: { userId },
      });
    }
    return thread;
  }

  async findMessagesByThreadId(threadId: string) {
    return this.prisma.assistantMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      select: { role: true, content: true },
    });
  }

  async findMessagesByUserId(userId: string) {
    return this.prisma.assistantMessage.findMany({
      where: { thread: { userId } },
      orderBy: { createdAt: 'asc' },
      select: {
        role: true,
        content: true,
        createdAt: true,
        thread: { select: { id: true } },
      },
    });
  }

  async createMessage(threadId: string, role: MessageRole, content: string) {
    return this.prisma.assistantMessage.create({
      data: { threadId, role, content },
    });
  }

  async updateThreadUpdatedAt(threadId: string) {
    return this.prisma.assistantThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });
  }
}
