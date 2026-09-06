import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProjectService } from './project.service';
import { Project } from './project.entity';

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
