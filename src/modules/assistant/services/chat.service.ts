import { Injectable, Logger } from '@nestjs/common';
import { ChatDto } from '../dto/chat.dto';
import { GoogleGenAI } from '@google/genai';
import { HabitsRepository } from '../../habits/repositories/habits.repository';
import { TrackingRepository } from '../../tracking/repositories/tracking.repository';
import { AssistantRepository } from '../repositories/assistant.repository';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private genAI: GoogleGenAI;

  constructor(
    private assistantRepository: AssistantRepository,
    private habitsRepository: HabitsRepository,
    private trackingRepository: TrackingRepository,
  ) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    this.genAI = new GoogleGenAI({apiKey});
  }

  private getFunctionDeclarations() {
    return [
      {
        name: 'getHabitByName',
        description: 'Gets a habit by its name. Use this when the user mentions a specific habit name to retrieve its details.',
        parameters: {
          type: 'object',
          properties: {
            habitName: {
              type: 'string',
              description: 'The name of the habit to retrieve',
            },
          },
          required: ['habitName'],
        },
      },
      {
        name: 'getHabitById',
        description: 'Gets a habit by its ID. Use this when you have a habit ID.',
        parameters: {
          type: 'object',
          properties: {
            habitId: {
              type: 'string',
              description: 'The unique identifier of the habit',
            },
          },
          required: ['habitId'],
        },
      },
      {
        name: 'getAllHabits',
        description: 'Gets all habits for the user. Use this when the user asks about their habits in general or wants to see all their habits.',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'checkHabitCompletion',
        description: 'Checks if a habit was completed on a specific date. Use this when the user asks if they completed a habit on a particular day (e.g., "yesterday", "today", or a specific date).',
        parameters: {
          type: 'object',
          properties: {
            habitName: {
              type: 'string',
              description: 'The name of the habit to check',
            },
            date: {
              type: 'string',
              description: 'The date to check in ISO format (YYYY-MM-DD) or relative terms like "yesterday", "today"',
            },
          },
          required: ['habitName', 'date'],
        },
      },
      {
        name: 'getTrackingByDateRange',
        description: 'Gets tracking records for a date range. Use this when the user asks about their tracking history over multiple days.',
        parameters: {
          type: 'object',
          properties: {
            startDate: {
              type: 'string',
              description: 'Start date in ISO format (YYYY-MM-DD)',
            },
            endDate: {
              type: 'string',
              description: 'End date in ISO format (YYYY-MM-DD)',
            },
            habitName: {
              type: 'string',
              description: 'Optional: Filter by specific habit name',
            },
          },
          required: ['startDate', 'endDate'],
        },
      },
      {
        name: 'getHabitTrackingStatus',
        description: 'Gets the tracking status for a habit on a specific date. Returns whether the habit was completed on that date.',
        parameters: {
          type: 'object',
          properties: {
            habitName: {
              type: 'string',
              description: 'The name of the habit',
            },
            date: {
              type: 'string',
              description: 'The date to check in ISO format (YYYY-MM-DD)',
            },
          },
          required: ['habitName', 'date'],
        },
      },
      {
        name: 'createHabit',
        description: 'Creates a new habit for the user. Use this when the user asks to create, add, or set up a new habit. Parse natural language day references (e.g., "every day" → [0,1,2,3,4,5,6], "weekdays" → [1,2,3,4,5], "weekends" → [0,6] for Saturday and Sunday).',
        parameters: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'The name of the habit to create',
            },
            weekDays: {
              type: 'array',
              items: {
                type: 'integer',
              },
              description: 'Array of weekday numbers where 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday (standard JavaScript Date.getDay() convention). Must include at least one day.',
            },
          },
          required: ['name', 'weekDays'],
        },
      },
    ];
  }

  private parseDate(dateString: string): Date {
    const lowerDate = dateString.toLowerCase().trim();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (lowerDate === 'today') {
      return today;
    }

    if (lowerDate === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;
    }

    if (lowerDate === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }

    // Try to parse as ISO date
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    // Default to today if parsing fails
    return today;
  }

  private async executeFunction(functionName: string, args: any, userId: string): Promise<any> {
    this.logger.log(`[Function Calling] Executing function: ${functionName}`, {
      functionName,
      args,
      userId,
    });

    let result: any;
    try {
      switch (functionName) {
        case 'getHabitByName': {
          const habits = await this.habitsRepository.findMany({
            userId,
            name: args.habitName,
          });
          if (habits.length === 0) {
            result = { error: `Habit "${args.habitName}" not found` };
          } else {
            result = { habit: habits[0] };
          }
          break;
        }

        case 'getHabitById': {
          const habit = await this.habitsRepository.getById(args.habitId, userId);
          if (!habit) {
            result = { error: `Habit with ID "${args.habitId}" not found` };
          } else {
            result = { habit };
          }
          break;
        }

        case 'getAllHabits': {
          const habits = await this.habitsRepository.getAll(userId);
          result = { habits };
          break;
        }

        case 'checkHabitCompletion': {
          const date = this.parseDate(args.date);
          const habits = await this.habitsRepository.findMany({
            userId,
            name: args.habitName,
          });

          if (habits.length === 0) {
            result = { error: `Habit "${args.habitName}" not found` };
          } else {
            const habit = habits[0];
            const tracking = await this.trackingRepository.getByIdAndDate(habit.id, date, userId);

            result = {
              habitName: habit.name,
              date: date.toISOString().split('T')[0],
              completed: tracking?.checked || false,
              tracking: tracking || null,
            };
          }
          break;
        }

        case 'getTrackingByDateRange': {
          const startDate = this.parseDate(args.startDate);
          const endDate = this.parseDate(args.endDate);

          const filters: any = {
            userId,
            dateRange: {
              start: startDate,
              end: endDate,
            },
          };

          if (args.habitName) {
            const habits = await this.habitsRepository.findMany({
              userId,
              name: args.habitName,
            });
            if (habits.length > 0) {
              filters.habitId = habits[0].id;
            }
          }

          const tracking = await this.trackingRepository.findMany(filters);
          result = { tracking, count: tracking.length };
          break;
        }

        case 'getHabitTrackingStatus': {
          const date = this.parseDate(args.date);
          const habits = await this.habitsRepository.findMany({
            userId,
            name: args.habitName,
          });

          if (habits.length === 0) {
            result = { error: `Habit "${args.habitName}" not found` };
          } else {
            const habit = habits[0];
            const tracking = await this.trackingRepository.getByIdAndDate(habit.id, date, userId);

            result = {
              habitName: habit.name,
              date: date.toISOString().split('T')[0],
              completed: tracking?.checked || false,
            };
          }
          break;
        }

        case 'createHabit': {
          // Validate name
          if (!args.name || typeof args.name !== 'string' || args.name.trim().length === 0) {
            result = { error: 'Habit name is required and must be a non-empty string' };
            break;
          }

          // Validate weekDays
          if (!Array.isArray(args.weekDays) || args.weekDays.length === 0) {
            result = { error: 'WeekDays must be a non-empty array' };
            break;
          }

          // Validate each weekday is a number between 0-6
          const weekDaysArray = args.weekDays as number[];
          const invalidDays = weekDaysArray.filter(
            (day: number) => typeof day !== 'number' || day < 0 || day > 6 || !Number.isInteger(day),
          );
          if (invalidDays.length > 0) {
            result = {
              error: `Invalid weekday values. Weekdays must be integers between 0 (Sunday) and 6 (Saturday)`,
            };
            break;
          }

          // Remove duplicates and sort (following CreateHabitService pattern)
          const uniqueWeekDays = [...new Set(weekDaysArray)];
          const sortedWeekDays = uniqueWeekDays.sort((a: number, b: number) => a - b);

          // Check if habit with same name already exists
          const existingHabits = await this.habitsRepository.findMany({
            userId,
            name: args.name.trim(),
          });

          if (existingHabits.length > 0) {
            result = { error: `A habit with the name "${args.name.trim()}" already exists` };
            break;
          }

          // Create the habit
          const createdHabit = await this.habitsRepository.create({
            name: args.name.trim(),
            weekDays: sortedWeekDays,
            userId,
            createdAt: new Date(),
          });

          result = {
            message: 'Habit created successfully',
            habit: {
              id: createdHabit.id,
              name: createdHabit.name,
              weekDays: createdHabit.weekDays,
              createdAt: createdHabit.createdAt,
            },
          };
          break;
        }

        default:
          this.logger.warn(`[Function Calling] Unknown function: ${functionName}`, {
            functionName,
            userId,
          });
          result = { error: `Unknown function: ${functionName}` };
      }

      // Log successful result
      this.logger.log(`[Function Calling] Function executed successfully: ${functionName}`, {
        functionName,
        userId,
        hasError: !!result.error,
        resultSummary: result.error 
          ? `Error: ${result.error}` 
          : `Success (result size: ${JSON.stringify(result).length} chars)`,
      });

      return result;
    } catch (error) {
      result = {
        error: error instanceof Error ? error.message : 'An error occurred while executing the function',
      };
      
      this.logger.error(`[Function Calling] Error executing function: ${functionName}`, {
        functionName,
        args,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      return result;
    }
  }

  async execute(userId: string, chatDto: ChatDto) {
    const { message } = chatDto;

    // Get or create thread for user
    const thread = await this.assistantRepository.getOrCreateThread(userId);

    // Fetch user's habits and recent tracking data for context
    const habitsList = await this.habitsRepository.findMany({
      userId,
      orderBy: { createdAt: 'desc' },
    });
    const habits = habitsList.map((h) => ({
      id: h.id,
      name: h.name,
      weekDays: h.weekDays,
      createdAt: h.createdAt,
    }));

    const allRecentTracking = await this.trackingRepository.findMany({
      userId,
      orderBy: { completedDate: 'desc' },
      include: { habit: true },
    });
    const recentTracking = allRecentTracking.slice(0, 10).map((t) => {
      const withHabit = t as typeof t & { habit?: { name: string } };
      return {
        completedDate: t.completedDate,
        checked: t.checked,
        habit: { name: withHabit.habit?.name ?? '' },
      };
    });

    // Retrieve conversation history from database
    const previousMessages = await this.assistantRepository.findMessagesByThreadId(thread.id);

    // Format conversation history for Gemini
    const chatHistory = previousMessages.map((msg) => ({
      role: msg.role === 'USER' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // If this is the first message in the conversation, include context
    let userMessage = message;
    if (previousMessages.length === 0) {
      console.log('Building context prompt');
      const contextPrompt = this.buildContextPrompt(habits, recentTracking);
      userMessage = `${contextPrompt}\n\nUser message: ${message}`;
    }

    // Get function declarations
    const functionDeclarations = this.getFunctionDeclarations();

    // Start chat with history and tools
    const chat = this.genAI.chats.create({
      model: 'gemini-2.5-flash',
      history: chatHistory.length > 0 ? chatHistory : undefined,
      config: {
        tools: [
          {
            functionDeclarations: functionDeclarations as any,
          },
        ],
      },
    });

    this.logger.log(`[Function Calling] Starting function calling loop`, {
      userId,
      availableFunctions: functionDeclarations.length,
      functionNames: functionDeclarations.map((f: any) => f.name),
    });

    // Handle function calling loop
    let assistantResponse = '';
    let currentMessage = userMessage;
    let maxIterations = 5; // Prevent infinite loops
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;
      this.logger.debug(`[Function Calling] Iteration ${iteration}/${maxIterations}`, {
        userId,
        iteration,
        messageLength: currentMessage.length,
      });
      
      const result = await chat.sendMessage({ message: currentMessage });

      // Check for function calls - try multiple possible response structures
      let functionCalls: any[] = [];
      
      // Try different possible response structures
      if ((result as any).functionCalls) {
        functionCalls = (result as any).functionCalls;
      } else if ((result as any).candidates?.[0]?.content?.parts) {
        const parts = (result as any).candidates[0].content.parts;
        functionCalls = parts
          .filter((part: any) => part.functionCall)
          .map((part: any) => ({
            name: part.functionCall.name,
            args: part.functionCall.args,
          }));
      } else if ((result as any).candidates?.[0]?.content?.parts?.[0]?.functionCall) {
        const functionCall = (result as any).candidates[0].content.parts[0].functionCall;
        functionCalls = [{
          name: functionCall.name,
          args: functionCall.args,
        }];
      }
      
      if (functionCalls && functionCalls.length > 0) {
        this.logger.log(`[Function Calling] Detected ${functionCalls.length} function call(s)`, {
          functionCalls: functionCalls.map((fc: any) => ({
            name: fc.name,
            args: fc.args,
          })),
          userId,
          iteration,
        });

        // Execute function calls
        const functionResults: Array<{ name: string; response: any }> = [];
        for (const functionCall of functionCalls) {
          const functionResult = await this.executeFunction(
            functionCall.name,
            functionCall.args || {},
            userId,
          );
          
          this.logger.log(`[Function Calling] Function result received: ${functionCall.name}`, {
            functionName: functionCall.name,
            hasError: !!functionResult.error,
            resultSize: JSON.stringify(functionResult).length,
            userId,
          });

          functionResults.push({
            name: functionCall.name,
            response: functionResult,
          });
        }

        // Send function results back to the model in proper format
        const functionResponseParts = functionResults.map((fr) => ({
          functionResponse: {
            name: fr.name,
            response: fr.response,
          },
        }));

        // Format as function response for the model
        currentMessage = JSON.stringify({
          functionResponses: functionResults.map((fr) => ({
            name: fr.name,
            response: fr.response,
          })),
        });
        
        this.logger.log(`[Function Calling] Sending function results back to model, continuing loop`, {
          functionResultsCount: functionResults.length,
          userId,
          iteration,
        });
        continue;
      }

      // No function calls, get text response
      this.logger.log(`[Function Calling] No function calls detected, getting text response`, {
        userId,
        iteration,
      });
      assistantResponse = result.text || (result as any).response?.text() || '';
      break;
    }

    if (iteration >= maxIterations) {
      this.logger.warn(`[Function Calling] Max iterations reached (${maxIterations})`, {
        userId,
        maxIterations,
        finalIteration: iteration,
      });
      assistantResponse = 'I encountered an issue processing your request. Please try again.';
    }

    this.logger.log(`[Function Calling] Function calling loop completed`, {
      userId,
      totalIterations: iteration,
      responseLength: assistantResponse.length,
    });

    // Store user message in database
    await this.assistantRepository.createMessage(thread.id, 'USER', message);

    // Store assistant response in database
    await this.assistantRepository.createMessage(thread.id, 'ASSISTANT', assistantResponse);

    // Update thread's updatedAt timestamp
    await this.assistantRepository.updateThreadUpdatedAt(thread.id);

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
      '\nProvide helpful, personalized advice and support related to habit tracking. Use this context when answering questions, but keep responses natural and conversational and short, do not answer with a long text, only answer with a short text.';

    return prompt;
  }
}
