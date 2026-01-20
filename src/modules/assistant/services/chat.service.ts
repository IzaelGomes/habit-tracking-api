import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ChatDto } from '../dto/chat.dto';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class ChatService {
  private genAI: GoogleGenAI;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    this.genAI = new GoogleGenAI({apiKey});
  }

  async execute(userId: string, chatDto: ChatDto) {
    const { message } = chatDto;

    // Get or create thread for user
    let thread = await this.prisma.assistantThread.findUnique({
      where: { userId },
    });

    if (!thread) {
      thread = await this.prisma.assistantThread.create({
        data: { userId },
      });
    }

    // Fetch user's habits and recent tracking data for context
    const habits = await this.prisma.habit.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        weekDays: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const recentTracking = await this.prisma.tracking.findMany({
      where: { userId },
      take: 10,
      orderBy: {
        completedDate: 'desc',
      },
      include: {
        habit: {
          select: {
            name: true,
          },
        },
      },
    });

    // Retrieve conversation history from database
    const previousMessages = await this.prisma.assistantMessage.findMany({
      where: { threadId: thread.id },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        role: true,
        content: true,
      },
    });

    // Format conversation history for Gemini
    const chatHistory = previousMessages.map((msg) => ({
      role: msg.role === 'USER' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // If this is the first message in the conversation, include context
    let userMessage = message;
    if (previousMessages.length === 0) {
      const contextPrompt = this.buildContextPrompt(habits, recentTracking);
      userMessage = `${contextPrompt}\n\nUser message: ${message}`;
    }

    // Start chat with history
    const chat = this.genAI.chats.create({
      model: 'gemini-2.5-flash',
      history: chatHistory.length > 0 ? chatHistory : undefined,
    });

    // Call Gemini API
    const result = await chat.sendMessage({ message: userMessage });
    const assistantResponse = result.text || (result as any).response?.text() || '';

    // Store user message in database
    await this.prisma.assistantMessage.create({
      data: {
        threadId: thread.id,
        role: 'USER',
        content: message,
      },
    });

    // Store assistant response in database
    await this.prisma.assistantMessage.create({
      data: {
        threadId: thread.id,
        role: 'ASSISTANT',
        content: assistantResponse,
      },
    });

    // Update thread's updatedAt timestamp
    await this.prisma.assistantThread.update({
      where: { id: thread.id },
      data: { updatedAt: new Date() },
    });

    return {
      message: assistantResponse,
    };
  }

  private buildContextPrompt(
    habits: Array<{ id: string; name: string; weekDays: number[]; createdAt: Date }>,
    recentTracking: Array<{
      completedDate: Date;
      checked: boolean;
      habit: { name: string };
    }>,
  ): string {
    let prompt = 'You are a helpful AI assistant for a habit tracking application. ';

    if (habits.length > 0) {
      prompt += '\n\nThe user has the following habits:\n';
      habits.forEach((habit, index) => {
        const weekDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const days = habit.weekDays.map(day => weekDayNames[day]).join(', ');
        prompt += `${index + 1}. ${habit.name} (scheduled on: ${days})\n`;
      });
    } else {
      prompt += '\n\nThe user currently has no habits set up.\n';
    }

    if (recentTracking.length > 0) {
      prompt += '\nRecent tracking activity:\n';
      recentTracking.slice(0, 5).forEach((tracking) => {
        const status = tracking.checked ? 'completed' : 'not completed';
        const date = new Date(tracking.completedDate).toLocaleDateString();
        prompt += `- ${tracking.habit.name}: ${status} on ${date}\n`;
      });
    }

    prompt +=
      '\nProvide helpful, personalized advice and support related to habit tracking. Use this context when answering questions, but keep responses natural and conversational.';

    return prompt;
  }
}
