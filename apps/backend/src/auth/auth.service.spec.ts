import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { UserService } from '../user/user.service.js';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: { findByUsername: async () => null, create: async () => ({ id: 1, username: 'a' }) },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
