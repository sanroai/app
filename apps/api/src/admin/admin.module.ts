import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminCurriculumController } from './admin-curriculum.controller';
import { AdminCurriculumService } from './admin-curriculum.service';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';

@Module({
  controllers: [AdminController, AdminCurriculumController, AdminDashboardController],
  providers: [AdminService, AdminCurriculumService, AdminDashboardService],
  exports: [AdminService],
})
export class AdminModule {}