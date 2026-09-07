import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Project } from '../project/project.entity';
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task-dto';
import { UpdateTaskDto } from './dto/update-task-dto';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly tasks: Repository<Task>,
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
  ) {}

  async create(userId: number, projectId: number, dto: CreateTaskDto) {
    const project = await this.projects.findOne({
      where: { id: projectId, user: { id: userId } },
    });
    if (!project) throw new NotFoundException('Project not found');

    try {
      return await this.tasks.save({
        description: dto.description,
        finishedAt: null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        project,
      });
    } catch (e) {
      throwUnique(e);
    }
  }

  async findOne(userId: number, id: number) {
    const task = await this.tasks.findOne({
      where: { id, project: { user: { id: userId } } },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(userId: number, id: number, dto: UpdateTaskDto) {
    const task = await this.ownedOpen(userId, id);

    if (dto.description !== undefined) {
      task.description = dto.description;
    }
    if (dto.dueDate !== undefined) {
      task.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }

    try {
      return await this.tasks.save(task);
    } catch (e) {
      throwUnique(e);
    }
  }

  async remove(userId: number, id: number) {
    const task = await this.ownedOpen(userId, id);
    await this.tasks.remove(task);
  }

  async complete(userId: number, id: number) {
    const task = await this.ownedOpen(userId, id);
    task.finishedAt = new Date();
    return this.tasks.save(task);
  }

  private async ownedOpen(userId: number, id: number): Promise<Task> {
    const task = await this.tasks.findOne({
      where: { id, project: { user: { id: userId } } },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.finishedAt !== null) {
      throw new ConflictException(
        'Completed tasks cannot be modified or deleted',
      );
    }

    return task;
  }

  async findAllByProject(userId: number, projectId: number) {
    const project = await this.projects.findOne({
      where: { id: projectId, user: { id: userId } },
    });
    if (!project) throw new NotFoundException('Project not found');
    return this.tasks.find({
      where: { project: { id: projectId } },
    });
  }
}

function throwUnique(e: unknown): never {
  if (
    e instanceof QueryFailedError &&
    (e as { driverError?: { code?: string } }).driverError?.code === '23505'
  ) {
    throw new ConflictException(
      'A task with this unique constraint already exists',
    );
  }
  throw e;
}
