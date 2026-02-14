import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true },
    });
  }

  async create(data: { username: string; password: string }) {
    return this.prisma.user.create({
      data: {
        username: data.username,
        password: data.password,
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
