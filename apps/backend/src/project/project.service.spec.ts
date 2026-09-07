import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  let service: ProjectService;
  const rows: Project[] = [];
  let seq = 1;

  beforeEach(async () => {
    rows.length = 0;
    seq = 1;
    const module = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: getRepositoryToken(Project),
          useValue: {
            save: async (entity: Project) => {
              if (!entity.id) entity.id = seq++;
              const i = rows.findIndex((r) => r.id === entity.id);
              if (i >= 0) rows[i] = entity;
              else rows.push(entity);
              return entity;
            },
            find: async (opts?: { where?: { user?: { id: number } } }) =>
              rows.filter((r) => r.user?.id === opts?.where?.user?.id),
            findOne: async (opts?: {
              where?: { id?: number; user?: { id: number } };
            }) =>
              rows.find(
                (r) =>
                  r.id === opts?.where?.id &&
                  r.user?.id === opts?.where?.user?.id,
              ) ?? null,
            remove: async (entity: Project) => {
              const i = rows.findIndex((r) => r.id === entity.id);
              if (i >= 0) rows.splice(i, 1);
              return entity;
            },
          },
        },
      ],
    }).compile();
    service = module.get(ProjectService);
  });

  it('scopes create and list to the user', async () => {
    await service.create(1, { title: 'Mine' });
    await service.create(2, { title: 'Theirs' });
    const mine = await service.findAll(1);
    expect(mine).toHaveLength(1);
    expect(mine[0].title).toBe('Mine');
  });

  it('404s missing or foreign project', async () => {
    const created = await service.create(1, { title: 'Mine' });
    await expect(service.findOne(1, 999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.findOne(2, created.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
