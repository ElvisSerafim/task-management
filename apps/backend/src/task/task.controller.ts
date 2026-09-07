import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard } from '../common/guard/session.guard';
import { UpdateTaskDto } from './dto/update-task-dto';
import { TaskService } from './task.service';
import { User } from '../common/decorators/user.decorator';

@UseGuards(SessionGuard)
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Patch(':id')
  update(
    @User() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.taskService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@User() userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.taskService.remove(userId, id);
  }

  @Post(':id/complete')
  complete(@User() userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.taskService.complete(userId, id);
  }
}
