import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { QueryFailedError } from 'typeorm';
import { UserService } from '../user/user.service';
import { AuthCredentialsDto } from './auth.dto';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.getOrThrow<string>('JWT_SECRET');
  }

  async register(dto: AuthCredentialsDto) {
    if (await this.userService.findByUsername(dto.username)) {
      throw new ConflictException('Username already taken');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    try {
      const user = await this.userService.create({
        username: dto.username,
        password: hashedPassword,
      });
      return { id: user.id, username: user.username };
    } catch (e) {
      if (
        e instanceof QueryFailedError &&
        (e as { driverError?: { code?: string } }).driverError?.code === '23505'
      ) {
        throw new ConflictException('Username already taken');
      }
      throw e;
    }
  }

  async login(dto: AuthCredentialsDto) {
    const user = await this.userService.findByUsername(dto.username);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = jwt.sign({ sub: String(user.id) }, this.jwtSecret, {
      expiresIn: '24h',
    });

    return { id: user.id, username: user.username, accessToken };
  }
}
