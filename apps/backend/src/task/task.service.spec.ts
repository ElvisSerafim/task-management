import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Project } from '../project/project.entity';
import { Task } from './task.entity';
import { TaskService } from './task.service';

describe('TaskService', () => {
  let service: TaskService;
  const projects: Project[] = [];
  const tasks: Task[] = [];
  let seq = 1;

  beforeEach(async () => {
    projects.length = 0;
    tasks.length = 0;
    seq = 1;
    const module = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Project),
          useValue: {
            findOne: async (opts?: {
              where?: { id?: number; user?: { id: number } };
            }) =>
              projects.find(
                (p) =>
                  p.id === opts?.where?.id &&
                  p.user?.id === opts?.where?.user?.id,
              ) ?? null,
          },
        },
        {
          provide: getRepositoryToken(Task),
          useValue: {
            save: async (entity: Task) => {
              if (!entity.id) entity.id = seq++;
              const i = tasks.findIndex((t) => t.id === entity.id);
              if (i >= 0) tasks[i] = entity;
              else tasks.push(entity);
              return entity;
            },
            findOne: async (opts?: {
              where?: { id?: number; project?: { user?: { id: number } } };
            }) =>
              tasks.find(
                (t) =>
                  t.id === opts?.where?.id &&
                  t.project?.user?.id === opts?.where?.project?.user?.id,
              ) ?? null,
            find: async (opts?: { where?: { project?: { id?: number } } }) =>
              tasks.filter((t) => t.project?.id === opts?.where?.project?.id),
            remove: async (entity: Task) => {
              const i = tasks.findIndex((t) => t.id === entity.id);
              if (i >= 0) tasks.splice(i, 1);
              return entity;
            },
          },
        },
      ],
    }).compile();
    service = module.get(TaskService);
  });

  it('404s list on missing project', async () => {
    await expect(service.findAllByProject(1, 99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });


  it('409s edit and delete after complete', async () => {
    const project = {
      id: 1,
      title: 'P',
      user: { id: 1 },
    } as Project;
    projects.push(project);

    const created = await service.create(1, 1, { description: 'Do it' });
    await service.complete(1, created.id);

    await expect(
      service.update(1, created.id, { description: 'nope', dueDate: null }),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(service.remove(1, created.id)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
