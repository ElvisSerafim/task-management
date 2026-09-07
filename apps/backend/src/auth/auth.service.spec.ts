import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueryFailedError } from 'typeorm';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';

describe('AuthService', () => {
  let service: AuthService;
  const users: { id: number; username: string; password: string }[] = [];

  beforeEach(async () => {
    users.length = 0;
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => 'test-jwt-secret' },
        },
        {
          provide: UserService,
          useValue: {
            findByUsername: (username: string) =>
              Promise.resolve(users.find((u) => u.username === username) ?? null),
            create: (data: { username: string; password: string }) => {
              const user = { id: users.length + 1, ...data };
              users.push(user);
              return Promise.resolve(user);
            },
          },
        },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('rejects duplicate register', async () => {
    await service.register({ username: 'ada', password: 'secret' });
    await expect(
      service.register({ username: 'ada', password: 'secret' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('maps unique register race to 409', async () => {
    const err = Object.assign(new QueryFailedError('', [], new Error('dup')), {
      driverError: { code: '23505' },
    });
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => 'test-jwt-secret' },
        },
        {
          provide: UserService,
          useValue: {
            findByUsername: () => Promise.resolve(null),
            create: () => Promise.reject(err),
          },
        },
      ],
    }).compile();
    const racing = module.get(AuthService);
    await expect(
      racing.register({ username: 'ada', password: 'secret' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects bad login', async () => {
    await service.register({ username: 'ada', password: 'secret' });
    await expect(
      service.login({ username: 'ada', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns accessToken on login', async () => {
    await service.register({ username: 'ada', password: 'secret' });
    const result = await service.login({ username: 'ada', password: 'secret' });
    expect(result).toMatchObject({ id: 1, username: 'ada' });
    expect(result.accessToken).toEqual(expect.any(String));
  });
});
