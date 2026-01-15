import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegisterDto } from '../dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RegisterService {
  constructor(private prisma: PrismaService) {}

  async execute(registerDto: RegisterDto) {
    const { username, password } = registerDto;
    console.log({ username, password });
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    try {
      const user = await this.prisma.user.create({
        data: {
          username,
          password: hashedPassword,
        },
        select: {
          id: true,
          username: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        message: 'User registered successfully',
        user,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to register user');
    }
  }
}

