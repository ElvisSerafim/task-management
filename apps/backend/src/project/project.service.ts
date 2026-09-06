import { Injectable } from '@nestjs/common';

@Injectable()
export class ProjectService {
  findAll() {
    return [];
  }

  create(project: unknown) {
    return project;
  }
}
