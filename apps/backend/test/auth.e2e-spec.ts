import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { AuthController } from './../src/auth/auth.controller';
import { AuthService } from './../src/auth/auth.service';
import { SessionGuard } from '../src/common/guard/session.guard';
import { UserService } from './../src/user/user.service';
import { ProjectController } from './../src/project/project.controller';
import { ProjectService } from './../src/project/project.service';
import { TaskService } from './../src/task/task.service';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

process.env.JWT_SECRET ??= 'test-jwt-secret';

describe('auth (e2e)', () => {
  let app: INestApplication;
  const users: { id: number; username: string; password: string }[] = [];

  beforeEach(async () => {
    users.length = 0;
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [AuthController, ProjectController],
      providers: [
        AuthService,
        SessionGuard,
        {
          provide: UserService,
          useValue: {
            findByUsername: (username: string) =>
              Promise.resolve(
                users.find((u) => u.username === username) ?? null,
              ),
            create: (data: { username: string; password: string }) => {
              const user = { id: users.length + 1, ...data };
              users.push(user);
              return Promise.resolve(user);
            },
          },
        },
        {
          provide: ProjectService,
          useValue: {
            findAll: () => Promise.resolve([]),
            create: () => Promise.resolve({}),
          },
        },
        { provide: TaskService, useValue: {} },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('register, login JWT, and protect /projects', async () => {
    const server = app.getHttpServer();
    const creds = { username: 'ada', password: 'secret' };

    const registered = await request(server)
      .post('/auth/register')
      .send(creds)
      .expect(201);
    expect(registered.body).toEqual({ id: 1, username: 'ada' });
    expect(registered.body.password).toBeUndefined();

    await request(server).post('/auth/register').send(creds).expect(409);

    const badLogin = await request(server)
      .post('/auth/login')
      .send({ username: 'ada', password: 'wrong' })
      .expect(401);
    expect(badLogin.body.accessToken).toBeUndefined();

    await request(server).get('/projects').expect(401);

    const loggedIn = await request(server)
      .post('/auth/login')
      .send(creds)
      .expect(200);
    expect(loggedIn.body.id).toBe(1);
    expect(loggedIn.body.username).toBe('ada');
    expect(loggedIn.body.accessToken).toEqual(expect.any(String));
    expect(loggedIn.body.password).toBeUndefined();
    expect(loggedIn.headers['set-cookie']).toBeUndefined();

    const token = loggedIn.body.accessToken as string;
    await request(server)
      .get('/projects')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    await request(server)
      .get('/projects')
      .set('Authorization', 'Bearer not-a-jwt')
      .expect(401);

    const agent = request.agent(server);
    await agent.post('/auth/login').send(creds).expect(200);
    await agent.get('/projects').expect(401);
  });
});
