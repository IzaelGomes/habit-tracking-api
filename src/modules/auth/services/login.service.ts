import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../repositories/user.repository';
import { LoginDto } from '../dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LoginService {
  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService,
  ) {}

  async execute(loginDto: LoginDto) {
    const { username, password } = loginDto;

    const user = await this.userRepository.findByUsername(username);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { userId: user.id };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
      },
    };
  }
}
