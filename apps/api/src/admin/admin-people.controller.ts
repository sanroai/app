import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { CreateParentSchema, CreateStudentSchema, CreateTeacherSchema, UpdateStudentSchema } from '@sanro/validation';
import { AdminPeopleService, ListResult, PeopleListQuery } from './admin-people.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles, SubscriptionRequired } from '../common/decorators/auth.decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RequestUser } from '../common/types/auth-context';

const PeopleListQuerySchema = z.object({
  institutionId: z.string().min(1).optional(),
  search: z.string().trim().max(200).optional(),
  grade: z.string().trim().optional(),
  status: z.string().trim().optional(),
  source: z.enum(['INSTITUTION', 'DIRECT_SANRO']).optional(),
  subscriptionStatus: z.string().trim().max(50).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

const UpdateTeacherSchema = CreateTeacherSchema.partial();
const UpdateParentSchema = CreateParentSchema.partial();

const TransferBodySchema = z.object({
  targetInstitutionId: z.string().min(1, 'Target institution is required'),
});

const StatusBodySchema = z.object({
  status: z.enum(['ACTIVE', 'DEACTIVATED']),
});

const LinkChildBodySchema = z.object({
  studentId: z.string().min(1, 'studentId is required'),
});

const DirectSubscriptionBodySchema = z.object({
  planKey: z.string().min(1, 'planKey is required'),
  status: z.enum(['ACTIVE', 'TRIAL', 'EXPIRED', 'CANCELLED', 'PAST_DUE', 'SUSPENDED']).default('ACTIVE'),
  startsAt: z.string().trim().optional(),
  endsAt: z.string().trim().optional(),
  reason: z.string().trim().max(500).optional(),
});

@ApiTags('admin-people')
@Roles('SUPER_ADMIN')
@SubscriptionRequired()
@Controller('admin/people')
export class AdminPeopleController {
  constructor(private readonly people: AdminPeopleService) {}

  /* ============================= STUDENTS ============================= */

  @Get('students')
  listStudents(@CurrentUser() user: RequestUser, @Query(new ZodValidationPipe(PeopleListQuerySchema)) q: PeopleListQuery): Promise<ListResult<any>> {
    return this.people.listStudents(user, q);
  }

  @Get('students/institution/:institutionId')
  listStudentsByInstitution(
    @CurrentUser() user: RequestUser,
    @Param('institutionId') institutionId: string,
    @Query(new ZodValidationPipe(PeopleListQuerySchema)) q: Omit<PeopleListQuery, 'institutionId'>,
  ): Promise<ListResult<any>> {
    return this.people.listStudentsByInstitution(user, institutionId, q);
  }

  @Get('students/search')
  searchStudents(@CurrentUser() user: RequestUser, @Query('search') search: string): Promise<any[]> {
    return this.people.searchStudents(user, search);
  }

  @Get('students/:id')
  studentDetail(@CurrentUser() user: RequestUser, @Param('id') id: string): Promise<any> {
    return this.people.studentDetail(user, id);
  }

  @Post('students')
  createStudent(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(CreateStudentSchema)) data: any): Promise<any> {
    return this.people.createStudent(user, data);
  }

  @Patch('students/:id')
  updateStudent(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(UpdateStudentSchema)) data: any): Promise<any> {
    return this.people.updateStudent(user, id, data);
  }

  @Post('students/:id/transfer')
  transferStudent(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(TransferBodySchema)) body: { targetInstitutionId: string }): Promise<any> {
    return this.people.transferStudent(user, id, body.targetInstitutionId);
  }

  @Post('students/:id/status')
  setStudentStatus(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(StatusBodySchema)) body: { status: 'ACTIVE' | 'DEACTIVATED' }): Promise<any> {
    return this.people.setStudentStatus(user, id, body.status);
  }

  @Post('students/:id/direct-subscription')
  setDirectSubscription(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(DirectSubscriptionBodySchema)) body: { planKey: string; status: string; startsAt?: string; endsAt?: string; reason?: string }): Promise<any> {
    return this.people.setDirectSubscription(user, id, body);
  }

  @Post('students/:id/disable')
  disableStudent(@CurrentUser() user: RequestUser, @Param('id') id: string): Promise<any> {
    return this.people.setStudentStatus(user, id, 'DEACTIVATED');
  }

  @Post('students/:id/enable')
  enableStudent(@CurrentUser() user: RequestUser, @Param('id') id: string): Promise<any> {
    return this.people.setStudentStatus(user, id, 'ACTIVE');
  }

  /* ============================= TEACHERS ============================= */

  @Get('teachers')
  listTeachers(@CurrentUser() user: RequestUser, @Query(new ZodValidationPipe(PeopleListQuerySchema)) q: PeopleListQuery): Promise<ListResult<any>> {
    return this.people.listTeachers(user, q);
  }

  @Get('teachers/:id')
  teacherDetail(@CurrentUser() user: RequestUser, @Param('id') id: string): Promise<any> {
    return this.people.teacherDetail(user, id);
  }

  @Post('teachers')
  createTeacher(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(CreateTeacherSchema)) data: any): Promise<any> {
    return this.people.createTeacher(user, data);
  }

  @Patch('teachers/:id')
  updateTeacher(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(UpdateTeacherSchema)) data: any): Promise<any> {
    return this.people.updateTeacher(user, id, data);
  }

  @Post('teachers/:id/transfer')
  transferTeacher(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(TransferBodySchema)) body: { targetInstitutionId: string }): Promise<any> {
    return this.people.transferTeacher(user, id, body.targetInstitutionId);
  }

  @Post('teachers/:id/status')
  setTeacherStatus(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(StatusBodySchema)) body: { status: 'ACTIVE' | 'DEACTIVATED' }): Promise<any> {
    return this.people.setTeacherStatus(user, id, body.status);
  }

  @Post('teachers/:id/disable')
  disableTeacher(@CurrentUser() user: RequestUser, @Param('id') id: string): Promise<any> {
    return this.people.setTeacherStatus(user, id, 'DEACTIVATED');
  }

  @Post('teachers/:id/enable')
  enableTeacher(@CurrentUser() user: RequestUser, @Param('id') id: string): Promise<any> {
    return this.people.setTeacherStatus(user, id, 'ACTIVE');
  }

  /* ============================= PARENTS ============================= */

  @Get('parents')
  listParents(@CurrentUser() user: RequestUser, @Query(new ZodValidationPipe(PeopleListQuerySchema)) q: PeopleListQuery): Promise<ListResult<any>> {
    return this.people.listParents(user, q);
  }

  @Get('parents/:id')
  parentDetail(@CurrentUser() user: RequestUser, @Param('id') id: string): Promise<any> {
    return this.people.parentDetail(user, id);
  }

  @Post('parents')
  createParent(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(CreateParentSchema)) data: any): Promise<any> {
    return this.people.createParent(user, data);
  }

  @Patch('parents/:id')
  updateParent(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(UpdateParentSchema)) data: any): Promise<any> {
    return this.people.updateParent(user, id, data);
  }

  @Post('parents/:id/students/:studentId/link')
  linkParentToStudent(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('studentId') studentId: string): Promise<any> {
    return this.people.linkParentToStudent(user, id, studentId);
  }

  @Post('parents/:id/students/:studentId/unlink')
  unlinkParentFromStudent(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('studentId') studentId: string): Promise<void> {
    return this.people.unlinkParentFromStudent(user, id, studentId);
  }

  @Post('parents/:id/status')
  setParentStatus(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(StatusBodySchema)) body: { status: 'ACTIVE' | 'DEACTIVATED' }): Promise<any> {
    return this.people.setParentStatus(user, id, body.status);
  }

  @Post('parents/:id/disable')
  disableParent(@CurrentUser() user: RequestUser, @Param('id') id: string): Promise<any> {
    return this.people.setParentStatus(user, id, 'DEACTIVATED');
  }

  @Post('parents/:id/enable')
  enableParent(@CurrentUser() user: RequestUser, @Param('id') id: string): Promise<any> {
    return this.people.setParentStatus(user, id, 'ACTIVE');
  }

  @Post('parents/:id/link-child')
  linkChild(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(LinkChildBodySchema)) body: { studentId: string }): Promise<any> {
    return this.people.linkParentToStudent(user, id, body.studentId);
  }

  @Post('parents/:id/unlink-child')
  unlinkChild(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(LinkChildBodySchema)) body: { studentId: string }): Promise<void> {
    return this.people.unlinkParentFromStudent(user, id, body.studentId);
  }
}