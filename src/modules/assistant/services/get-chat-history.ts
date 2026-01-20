import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
class GetChatHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string) {
    const chatHistory = await this.prisma.assistantMessage.findMany({
      where: { thread: { userId } },
      orderBy: { createdAt: 'asc' },
      select: {
        role: true,
        content: true,
        createdAt: true,
        thread: {
          select: {
            id: true,
          },
        },
      },
    });
    return chatHistory;
  }
}

export default GetChatHistoryService;