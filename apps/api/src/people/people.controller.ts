import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@sanro/types';
import { StudentsService } from './students.service';
import { TeachersService } from './teachers.service';
import { ParentsService } from './parents.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/auth.decorators';
import { RequestUser } from '../common/types/auth-context';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateStudentSchema, UpdateStudentSchema, MoveStudentSchema, CreateTeacherSchema, CreateParentSchema } from '@sanro/validation';

@ApiTags('students')
@Controller('students')
export class StudentsController {
  constructor(private readonly service: StudentsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.service.listStudents(user, {
      academicYearId: query.academicYearId,
      groupId: query.groupId,
      search: query.search,
      status: query.status,
      page: query.page ? Number(query.page) : 1,
      pageSize: query.pageSize ? Number(query.pageSize) : 25,
    });
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Post()
  create(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(CreateStudentSchema)) body: unknown) {
    return this.service.createStudent(user, body as Parameters<typeof this.service.createStudent>[1]);
  }

  @Get(':id')
  detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.studentDetail(user, id);
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Patch(':id')
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(UpdateStudentSchema)) body: unknown) {
    return this.service.updateStudent(user, id, body as Parameters<typeof this.service.updateStudent>[2]);
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Post(':id/deactivate')
  deactivate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.setStatus(user, id, 'DEACTIVATED');
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Post(':id/activate')
  reactivate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.setStatus(user, id, 'ACTIVE');
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Post(':id/move')
  move(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(MoveStudentSchema)) body: unknown) {
    return this.service.moveStudent(user, id, body as Parameters<typeof this.service.moveStudent>[2]);
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Post(':id/link-parent')
  linkParent(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: { name: string; phone?: string; email?: string },
  ) {
    const institutionId = user.institutionId as string;
    return this.service.linkParent(institutionId, id, body);
  }
}

@ApiTags('teachers')
@Controller('teachers')
export class TeachersController {
  constructor(private readonly service: TeachersService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.service.listTeachers(user);
  }

  @Roles(Role.INSTITUTION_ADMIN)
  @Post()
  create(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(CreateTeacherSchema)) body: unknown) {
    return this.service.createTeacher(user, body as Parameters<typeof this.service.createTeacher>[1]);
  }

  @Roles(Role.INSTITUTION_ADMIN)
  @Post(':id/deactivate')
  deactivate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.setStatus(user, id, 'DEACTIVATED');
  }

  @Roles(Role.INSTITUTION_ADMIN)
  @Post(':id/activate')
  reactivate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.setStatus(user, id, 'ACTIVE');
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Post(':id/assign-groups')
  assignGroups(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: { groupIds: string[] },
  ) {
    return this.service.assignGroups(user, id, body.groupIds);
  }
}

@ApiTags('parents')
@Controller('parents')
export class ParentsController {
  constructor(private readonly service: ParentsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.service.listParents(user);
  }

  @Roles(Role.INSTITUTION_ADMIN)
  @Post()
  create(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(CreateParentSchema)) body: unknown) {
    return this.service.createParent(user, body as Parameters<typeof this.service.createParent>[1]);
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER, Role.PARENT)
  @Post(':id/link-student')
  linkStudent(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: { studentId: string }) {
    return this.service.linkChild(user, id, body.studentId);
  }

  @Get('me/dashboard')
  dashboard(@CurrentUser() user: RequestUser) {
    return this.service.parentDashboard(user);
  }
}