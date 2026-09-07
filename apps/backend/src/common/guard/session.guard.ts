import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) throw new UnauthorizedException();

    try {
      const secret = this.configService.getOrThrow<string>('JWT_SECRET');
      const payload = jwt.verify(token, secret);

      if (typeof payload !== 'object' || payload.sub == null) {
        throw new UnauthorizedException();
      }

      const userId = Number(payload.sub);
      if (!Number.isFinite(userId)) throw new UnauthorizedException();

      req.userId = userId;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
