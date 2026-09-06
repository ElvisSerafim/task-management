import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/session.guard.js';
import { ProjectService } from './project.service';
import { Project } from './project.entity';

@UseGuards(SessionGuard)
@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  async findAll() {
    return await this.projectService.findAll();
  }

  @Post()
  async create(@Body() createProjectDto: Partial<Project>) {
    return await this.projectService.create(createProjectDto);
  }
}
