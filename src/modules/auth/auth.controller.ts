import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { RegisterService } from './services/register.service';
import { LoginService } from './services/login.service';
import { LogoutService } from './services/logout.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerService: RegisterService,
    private readonly loginService: LoginService,
    private readonly logoutService: LogoutService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.registerService.execute(registerDto);
  }

  @Post('signin')
  async login(@Body() loginDto: LoginDto) {
    return this.loginService.execute(loginDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout() {
    return this.logoutService.execute();
  }
}

