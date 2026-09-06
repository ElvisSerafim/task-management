import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { AuthCredentialsDto } from './auth.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: AuthCredentialsDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: AuthCredentialsDto, @Req() req: Request) {
    const user = await this.authService.login(dto);
    req.session.userId = user.id;
    return user;
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Req() req: Request) {
    return new Promise<void>((resolve, reject) => {
      if (!req.session) {
        resolve();
        return;
      }
      req.session.destroy((err) => (err ? reject(err) : resolve()));
    });
  }
}
