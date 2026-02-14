import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { RegisterDto } from '../dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RegisterService {
  constructor(private userRepository: UserRepository) {}

  async execute(registerDto: RegisterDto) {
    const { username, password } = registerDto;

    const existingUser = await this.userRepository.findByUsername(username);

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    try {
      const user = await this.userRepository.create({
        username,
        password: hashedPassword,
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
