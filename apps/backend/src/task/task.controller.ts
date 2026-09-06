import { Controller, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/session.guard.js';

@UseGuards(SessionGuard)
@Controller('task')
export class TaskController {}
