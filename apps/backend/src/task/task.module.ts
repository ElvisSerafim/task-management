import { Module } from '@nestjs/common';
import { TaskService } from './task.service.js';
import { TaskController } from './task.controller.js';

@Module({
  providers: [TaskService],
  controllers: [TaskController]
})
export class TaskModule {}
