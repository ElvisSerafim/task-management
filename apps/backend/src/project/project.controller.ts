import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard } from '../common/guard/session.guard';
import { CreateProjectDto } from './dto/create-project-dto';
import { ProjectService } from './project.service';
import { UpdateProjectDto } from './dto/update-project-dto';
import { TaskService } from '../task/task.service';
import { CreateTaskDto } from '../task/dto/create-task-dto';
import { User } from '../common/decorators/user.decorator';

@UseGuards(SessionGuard)
@Controller('projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly taskService: TaskService,
  ) {}

  @Post()
  create(@User() userId: number, @Body() dto: CreateProjectDto) {
    return this.projectService.create(userId, dto);
  }

  @Post(':id/tasks')
  createTask(
    @User() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTaskDto,
  ) {
    return this.taskService.create(userId, id, dto);
  }

  @Get(':id/tasks')
  findTasks(@User() userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.taskService.findAllByProject(userId, id);
  }

  @Get()
  findAll(@User() userId: number) {
    return this.projectService.findAll(userId);
  }

  @Get(':id')
  findOne(@User() userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.projectService.findOne(userId, id);
  }

  @Patch(':id')
  update(
    @User() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@User() userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.projectService.remove(userId, id);
  }
}
