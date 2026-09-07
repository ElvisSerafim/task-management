import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { AuthController } from './../src/auth/auth.controller.js';
import { AuthService } from './../src/auth/auth.service.js';
import { SessionGuard } from '../src/common/guard/session.guard.js';
import { UserService } from './../src/user/user.service.js';
import { Project } from './../src/project/project.entity.js';
import { ProjectController } from './../src/project/project.controller.js';
import { ProjectService } from './../src/project/project.service.js';
import { Task } from './../src/task/task.entity.js';
import { TaskController } from './../src/task/task.controller.js';
import { TaskService } from './../src/task/task.service.js';

process.env.JWT_SECRET ??= 'test-jwt-secret';

interface BaseEntity {
  id?: number;
  user?: { id: number };
  project?: { id: number };
}

function memoryRepo<T extends BaseEntity>(rows: T[]) {
  let seq = 1;

  return {
    save: async (entity: T): Promise<T> => {
      if (!entity.id) entity.id = seq++;
      const index = rows.findIndex((r) => r.id === entity.id);
      if (index >= 0) rows[index] = entity;
      else rows.push(entity);
      return entity;
    },

    find: async (opts?: { where?: Record<string, unknown> }): Promise<T[]> => {
      if (!opts?.where) return rows;

      const targetUserId = (opts.where.user as { id?: number })?.id;
      const targetProjectId = (opts.where.project as { id?: number })?.id;

      return rows.filter((r) => {
        if (targetUserId !== undefined && r.user?.id !== targetUserId)
          return false;
        if (targetProjectId !== undefined && r.project?.id !== targetProjectId)
          return false;
        return true;
      });
    },

    findOne: async (opts?: {
      where?: Record<string, unknown>;
    }): Promise<T | null> => {
      if (!opts?.where) return rows[0] ?? null;

      const targetId = opts.where.id as number | undefined;
      const targetUserId = (opts.where.user as { id?: number })?.id;

      const found = rows.find((r) => {
        if (targetId !== undefined && r.id !== targetId) return false;
        if (targetUserId !== undefined && r.user?.id !== targetUserId)
          return false;
        return true;
      });

      return found ?? null;
    },

    remove: async (entity: T): Promise<T> => {
      const index = rows.findIndex((r) => r.id === entity.id);
      if (index >= 0) rows.splice(index, 1);
      return entity;
    },
  };
}

function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}

describe('project and task (e2e)', () => {
  let app: INestApplication;
  const users: { id: number; username: string; password: string }[] = [];
  const projects: Project[] = [];
  const tasks: Task[] = [];

  beforeEach(async () => {
    users.length = 0;
    projects.length = 0;
    tasks.length = 0;
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [AuthController, ProjectController, TaskController],
      providers: [
        AuthService,
        SessionGuard,
        ProjectService,
        TaskService,
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
          provide: getRepositoryToken(Project),
          useValue: memoryRepo(projects),
        },
        { provide: getRepositoryToken(Task), useValue: memoryRepo(tasks) },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('crud, complete lock, and 404 for another user', async () => {
    const server = app.getHttpServer();
    await request(server)
      .post('/auth/register')
      .send({ username: 'ada', password: 'secret' })
      .expect(201);
    const adaLogin = await request(server)
      .post('/auth/login')
      .send({ username: 'ada', password: 'secret' })
      .expect(200);
    const ada = bearer(adaLogin.body.accessToken);

    const created = await request(server)
      .post('/projects')
      .set(ada)
      .send({ title: 'Ship' })
      .expect(201);
    expect(created.body.title).toBe('Ship');
    const projectId = created.body.id;

    const listed = await request(server).get('/projects').set(ada).expect(200);
    expect(listed.body).toHaveLength(1);

    await request(server)
      .patch(`/projects/${projectId}`)
      .set(ada)
      .send({ title: 'Shipped' })
      .expect(200);
    const got = await request(server)
      .get(`/projects/${projectId}`)
      .set(ada)
      .expect(200);
    expect(got.body.title).toBe('Shipped');

    const task = await request(server)
      .post(`/projects/${projectId}/tasks`)
      .set(ada)
      .send({ description: 'Write spec' })
      .expect(201);
    expect(task.body.finishedAt).toBeNull();
    const taskId = task.body.id;

    const nested = await request(server)
      .get(`/projects/${projectId}/tasks`)
      .set(ada)
      .expect(200);
    expect(nested.body).toHaveLength(1);
    expect(nested.body[0].id).toBe(taskId);

    await request(server)
      .patch(`/tasks/${taskId}`)
      .set(ada)
      .send({ description: 'Write tests' })
      .expect(200);
    await request(server).delete(`/tasks/${taskId}`).set(ada).expect(204);

    const locked = await request(server)
      .post(`/projects/${projectId}/tasks`)
      .set(ada)
      .send({ description: 'Ship it' })
      .expect(201);
    const lockedId = locked.body.id;
    const done = await request(server)
      .post(`/tasks/${lockedId}/complete`)
      .set(ada)
      .expect(201);
    expect(done.body.finishedAt).toBeTruthy();
    await request(server)
      .patch(`/tasks/${lockedId}`)
      .set(ada)
      .send({ description: 'nope' })
      .expect(409);
    await request(server).delete(`/tasks/${lockedId}`).set(ada).expect(409);
    await request(server)
      .post(`/tasks/${lockedId}/complete`)
      .set(ada)
      .expect(409);

    await request(server).delete(`/projects/${projectId}`).set(ada).expect(204);
    await request(server).get(`/projects/${projectId}`).set(ada).expect(404);

    const other = await request(server)
      .post('/projects')
      .set(ada)
      .send({ title: 'Secret' })
      .expect(201);

    await request(server)
      .post('/auth/register')
      .send({ username: 'bob', password: 'secret' })
      .expect(201);
    const bobLogin = await request(server)
      .post('/auth/login')
      .send({ username: 'bob', password: 'secret' })
      .expect(200);
    const bob = bearer(bobLogin.body.accessToken);
    await request(server)
      .get(`/projects/${other.body.id}`)
      .set(bob)
      .expect(404);
    await request(server)
      .patch(`/projects/${other.body.id}`)
      .set(bob)
      .send({ title: 'Stolen' })
      .expect(404);
    await request(server)
      .post(`/projects/${other.body.id}/tasks`)
      .set(bob)
      .send({ description: 'Hijack' })
      .expect(404);
  });
});
