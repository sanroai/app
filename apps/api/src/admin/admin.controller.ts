import { Body, Controller, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { z } from 'zod';
import {
  AdminCreateInstitutionSchema,
  ChangeAdminSchema,
  ChangeUserLimitSchema,
  InstitutionStatusPatchSchema,
  InstitutionsQuerySchema,
  RenewSubscriptionSchema,
  SetSubscriptionSchema,
  UpdateInstitutionSchema,
} from '@sanro/validation';
import { AdminService } from './admin.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/auth.decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RequestUser } from '../common/types/auth-context';

const ListQuerySchema = InstitutionsQuerySchema.extend({
  subscriptionStatus: z
    .enum(['ACTIVE', 'TRIAL', 'EXPIRED', 'CANCELLED', 'PAST_DUE', 'SUSPENDED', 'EXPIRING_SOON', 'NONE'])
    .optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
type ListQuery = z.infer<typeof ListQuerySchema>;

const UpdateInstitutionBodySchema = UpdateInstitutionSchema.extend({
  description: z.string().trim().max(1000).optional(),
  country: z.string().trim().max(120).optional(),
  website: z.string().trim().url('Invalid website').optional(),
  contactPerson: z.string().trim().max(200).optional(),
});

const ReasonBodySchema = z.object({ reason: z.string().trim().max(500).optional() });

function toListFilters(q: ListQuery) {
  return {
    search: q.search,
    type: q.type,
    status: q.status,
    subscriptionStatus: q.subscriptionStatus,
    plan: q.plan,
    limitExceeded: q.limitExceeded === undefined ? undefined : q.limitExceeded === 'true',
    from: q.from,
    to: q.to,
    page: q.page,
    pageSize: q.pageSize,
    sortBy: q.sortBy,
    sortDir: q.sortDir,
  };
}

@ApiTags('admin')
@Roles('SUPER_ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get('institutions')
  listInstitutions(@CurrentUser() user: RequestUser, @Query(new ZodValidationPipe(ListQuerySchema)) query: ListQuery) {
    return this.service.listInstitutions(user, toListFilters(query));
  }

  @Get('institutions/export')
  async exportInstitutions(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(ListQuerySchema)) query: ListQuery,
    @Res({ passthrough: true }) res: Response,
  ) {
    const csv = await this.service.exportInstitutions(user, {
      search: query.search,
      type: query.type,
      status: query.status,
      subscriptionStatus: query.subscriptionStatus,
      plan: query.plan,
      limitExceeded: query.limitExceeded === undefined ? undefined : query.limitExceeded === 'true',
      from: query.from,
      to: query.to,
      sortBy: query.sortBy,
      sortDir: query.sortDir,
    });
    res
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="institutions-${new Date().toISOString().slice(0, 10)}.csv"`);
    return csv;
  }

  @Get('institutions/:id')
  getInstitution(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.getInstitution(user, id);
  }

  @Post('institutions')
  createInstitution(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(AdminCreateInstitutionSchema)) body: z.infer<typeof AdminCreateInstitutionSchema>) {
    return this.service.createInstitution(user, body);
  }

  @Patch('institutions/:id')
  updateInstitution(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateInstitutionBodySchema)) body: Record<string, unknown>,
  ) {
    return this.service.updateInstitution(user, id, body);
  }

  @Patch('institutions/:id/status')
  updateStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(InstitutionStatusPatchSchema)) body: { status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'ARCHIVED' | 'PENDING'; reason?: string },
  ) {
    return this.service.updateStatus(user, id, body);
  }

  @Post('institutions/:id/activate')
  activate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(ReasonBodySchema)) body: { reason?: string }) {
    return this.service.activate(user, id, body.reason);
  }

  @Post('institutions/:id/suspend')
  suspend(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(ReasonBodySchema)) body: { reason?: string }) {
    return this.service.suspend(user, id, body.reason);
  }

  @Post('institutions/:id/archive')
  archive(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(ReasonBodySchema)) body: { reason?: string }) {
    return this.service.archive(user, id, body.reason);
  }

  @Post('institutions/:id/restore')
  restore(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(ReasonBodySchema)) body: { reason?: string }) {
    return this.service.restore(user, id, body.reason);
  }

  @Post('institutions/:id/expire')
  expire(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(ReasonBodySchema)) body: { reason?: string }) {
    return this.service.expire(user, id, body.reason);
  }

  @Post('institutions/:id/subscription')
  setSubscription(
    @CurrentUser() user: RequestUser,
    @Param('id') institutionId: string,
    @Body(new ZodValidationPipe(SetSubscriptionSchema)) body: { planKey: 'STUDENT_MONTHLY' | 'STUDENT_YEARLY' | 'INSTITUTION'; status?: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED' | 'PAST_DUE' | 'SUSPENDED'; startsAt?: string; endsAt?: string; seatLimit?: number; reason?: string },
  ) {
    return this.service.setSubscription(user, institutionId, body);
  }

  @Post('institutions/:id/subscription/renew')
  renewSubscription(
    @CurrentUser() user: RequestUser,
    @Param('id') institutionId: string,
    @Body(new ZodValidationPipe(RenewSubscriptionSchema)) body: { endDate: string; planKey?: 'STUDENT_MONTHLY' | 'STUDENT_YEARLY' | 'INSTITUTION'; seatLimit?: number; startsAt?: string; reason?: string },
  ) {
    return this.service.renewSubscription(user, institutionId, body);
  }

  @Post('institutions/:id/subscription/expire')
  expireSubscription(@CurrentUser() user: RequestUser, @Param('id') institutionId: string, @Body(new ZodValidationPipe(ReasonBodySchema)) body: { reason?: string }) {
    return this.service.expireSubscription(user, institutionId, body.reason);
  }

  @Patch('institutions/:id/user-limit')
  changeUserLimit(
    @CurrentUser() user: RequestUser,
    @Param('id') institutionId: string,
    @Body(new ZodValidationPipe(ChangeUserLimitSchema)) body: { seatLimit: number; reason?: string },
  ) {
    return this.service.changeUserLimit(user, institutionId, body);
  }

  @Get('institutions/:id/users')
  listUsers(@CurrentUser() user: RequestUser, @Param('id') institutionId: string) {
    return this.service.listUsers(user, institutionId);
  }

  @Patch('institutions/:id/admin')
  changeAdmin(
    @CurrentUser() user: RequestUser,
    @Param('id') institutionId: string,
    @Body(new ZodValidationPipe(ChangeAdminSchema)) body: { assignUserId?: string; adminEmail?: string; adminName?: string; reason?: string },
  ) {
    return this.service.changeAdmin(user, institutionId, body);
  }

  @Post('institutions/:id/users/:userId/disable')
  disableUser(@CurrentUser() user: RequestUser, @Param('id') institutionId: string, @Param('userId') userId: string, @Body(new ZodValidationPipe(ReasonBodySchema)) body: { reason?: string }) {
    return this.service.disableUser(user, institutionId, userId, body.reason);
  }

  @Post('institutions/:id/users/:userId/enable')
  enableUser(@CurrentUser() user: RequestUser, @Param('id') institutionId: string, @Param('userId') userId: string, @Body(new ZodValidationPipe(ReasonBodySchema)) body: { reason?: string }) {
    return this.service.enableUser(user, institutionId, userId, body.reason);
  }

  @Get('institutions/:id/subscription-history')
  subscriptionHistory(@CurrentUser() user: RequestUser, @Param('id') institutionId: string) {
    return this.service.subscriptionHistory(user, institutionId);
  }

  @Get('institutions/:id/audit')
  institutionAudit(@CurrentUser() user: RequestUser, @Param('id') institutionId: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.service.institutionAudit(user, institutionId, Number(page) || 1, Number(pageSize) || 25);
  }

  @Get('plans')
  plans(@CurrentUser() user: RequestUser) {
    return this.service.plans(user);
  }

  @Get('dashboard')
  dashboard(@CurrentUser() user: RequestUser) {
    return this.service.dashboard(user);
  }

  @Get('curriculum')
  curriculum(@CurrentUser() user: RequestUser) {
    return this.service.curriculumTree(user);
  }

  @Post('curriculum/boards')
  createBoard(@CurrentUser() user: RequestUser, @Body() body: { name: string; code: string }) {
    return this.service.createBoard(user, body);
  }

  @Post('curriculum/grades/:boardId')
  createGrade(@CurrentUser() user: RequestUser, @Param('boardId') boardId: string, @Body() body: { name: string; order?: number }) {
    return this.service.createGrade(user, boardId, body);
  }

  @Post('curriculum/subjects')
  createSubject(
    @CurrentUser() user: RequestUser,
    @Body() body: { boardId: string; name: string; code: string; color?: string },
  ) {
    return this.service.createSubject(user, body);
  }

  @Post('curriculum/chapters')
  createChapter(@CurrentUser() user: RequestUser, @Body() body: { subjectId: string; name: string; code: string; grade: string; order?: number }) {
    return this.service.createChapter(user, body);
  }

  @Post('curriculum/topics')
  createTopic(@CurrentUser() user: RequestUser, @Body() body: { chapterId: string; name: string; order?: number }) {
    return this.service.createTopic(user, body);
  }

  @Post('curriculum/concepts')
  createConcept(@CurrentUser() user: RequestUser, @Body() body: { topicId: string; name: string; order?: number }) {
    return this.service.createConcept(user, body);
  }

  @Get('audit')
  audit(@CurrentUser() user: RequestUser, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.service.auditLogs(user, Number(page) || 1, Number(pageSize) || 50);
  }

  @Get('subscriptions')
  subscriptions(@CurrentUser() user: RequestUser) {
    return this.service.subscriptions(user);
  }

  @Get('leads')
  contactLeads(@CurrentUser() user: RequestUser, @Query('limit') limit?: string) {
    return this.service.contactLeads(user, Number(limit) || 100);
  }
}