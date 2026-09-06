import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { UserService } from '../user/user.service.js';
import { AuthCredentialsDto } from './auth.dto.js';

@Injectable()
export class AuthService {
  constructor(private readonly users: UserService) {}

  async register(dto: AuthCredentialsDto) {
    if (await this.users.findByUsername(dto.username)) {
      throw new ConflictException('Username already taken');
    }
    const user = await this.users.create({
      username: dto.username,
      password: await bcrypt.hash(dto.password, 10),
    });
    return { id: user.id, username: user.username };
  }

  async login(dto: AuthCredentialsDto) {
    const user = await this.users.findByUsername(dto.username);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return { id: user.id, username: user.username };
  }
}
