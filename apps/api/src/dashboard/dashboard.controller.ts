import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/auth.decorators';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService, private readonly prisma: PrismaService) {}

  @Roles('STUDENT')
  @Get('student')
  studentHome(@CurrentUser() user: RequestUser) {
    return this.service.studentHome(user);
  }

  @Roles('TEACHER', 'INSTITUTION_ADMIN')
  @Get('teacher')
  teacherHome(@CurrentUser() user: RequestUser) {
    return this.service.teacherHome(user);
  }

  @Roles('INSTITUTION_ADMIN')
  @Get('institution')
  institutionHome(@CurrentUser() user: RequestUser) {
    return this.service.institutionHome(user);
  }

  @Roles('PARENT', 'INSTITUTION_ADMIN')
  @Get('parent')
  parentHome(@CurrentUser() user: RequestUser) {
    return this.service.parentHome(user);
  }

  @Roles('SUPER_ADMIN')
  @Get('super-admin')
  async superAdminHome() {
    const [institutions, activeStudents, activeTeachers, assessments, institutionsByType] = await Promise.all([
      this.prisma.institution.count({ where: { status: 'ACTIVE' } }),
      this.prisma.student.count({ where: { status: 'ACTIVE' } }),
      this.prisma.teacher.count(),
      this.prisma.assessment.count(),
      this.prisma.institution.groupBy({ by: ['type'], _count: true }),
    ]);
    return {
      platform: {
        institutions,
        activeStudents,
        activeTeachers,
        assessments,
        institutionsByType: institutionsByType.map((r) => ({ type: r.type, count: r._count })),
      },
    };
  }
}