import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project-dto';
import { UpdateProjectDto } from './dto/update-project-dto';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
  ) {}

  create(userId: number, dto: CreateProjectDto) {
    return this.projects.save({ title: dto.title, user: { id: userId } });
  }

  findAll(userId: number) {
    return this.projects.find({ where: { user: { id: userId } } });
  }

  async findOne(userId: number, id: number) {
    const project = await this.projects.findOne({
      where: { id, user: { id: userId } },
      relations: { tasks: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(userId: number, id: number, dto: UpdateProjectDto) {
    const project = await this.findOwned(userId, id);

    if (dto.title !== undefined) {
      project.title = dto.title;
    }

    return this.projects.save(project);
  }

  async remove(userId: number, id: number) {
    const project = await this.findOwned(userId, id);
    await this.projects.remove(project);
  }

  private async findOwned(userId: number, id: number): Promise<Project> {
    const project = await this.projects.findOne({
      where: { id, user: { id: userId } },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }
}
