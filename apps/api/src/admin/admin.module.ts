import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminCurriculumController } from './admin-curriculum.controller';
import { AdminCurriculumService } from './admin-curriculum.service';

@Module({
  controllers: [AdminController, AdminCurriculumController],
  providers: [AdminService, AdminCurriculumService],
  exports: [AdminService],
})
export class AdminModule {}