import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import request from 'supertest';
import { AuthController } from './../src/auth/auth.controller.js';
import { AuthService } from './../src/auth/auth.service.js';
import { UserService } from './../src/user/user.service.js';
import { ProjectController } from './../src/project/project.controller.js';
import { ProjectService } from './../src/project/project.service.js';

describe('auth (e2e)', () => {
  let app: INestApplication;
  const users: { id: number; username: string; password: string }[] = [];

  beforeEach(async () => {
    users.length = 0;
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController, ProjectController],
      providers: [
        AuthService,
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
        {
          provide: ProjectService,
          useValue: { findAll: () => Promise.resolve([]), create: () => Promise.resolve({}) },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.use(
      session({
        secret: 'test',
        resave: false,
        saveUninitialized: false,
        cookie: { httpOnly: true },
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('register, login, logout, and protect /project', async () => {
    const server = app.getHttpServer();
    const creds = { username: 'ada', password: 'secret' };

    const registered = await request(server).post('/auth/register').send(creds).expect(201);
    expect(registered.body).toEqual({ id: 1, username: 'ada' });
    expect(registered.body.password).toBeUndefined();

    await request(server).post('/auth/register').send(creds).expect(409);

    await request(server)
      .post('/auth/login')
      .send({ username: 'ada', password: 'wrong' })
      .expect(401);

    await request(server).get('/project').expect(401);

    const agent = request.agent(server);
    const loggedIn = await agent.post('/auth/login').send(creds).expect(200);
    expect(loggedIn.body).toEqual({ id: 1, username: 'ada' });
    expect(loggedIn.headers['set-cookie']).toBeDefined();

    await agent.get('/project').expect(200);
    await agent.post('/auth/logout').expect(204);
    await agent.get('/project').expect(401);

    await request(server).post('/auth/logout').expect(204);
  });
});
