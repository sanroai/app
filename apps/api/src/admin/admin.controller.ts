import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/auth.decorators';
import { RequestUser } from '../common/types/auth-context';

@ApiTags('admin')
@Roles('SUPER_ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get('institutions')
  listInstitutions(@CurrentUser() user: RequestUser, @Query('search') search?: string) {
    return this.service.listInstitutions(user, search);
  }

  @Get('institutions/:id')
  getInstitution(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.getInstitution(user, id);
  }

  @Post('institutions')
  createInstitution(@CurrentUser() user: RequestUser, @Body() body: Parameters<typeof this.service.createInstitution>[1]) {
    return this.service.createInstitution(user, body);
  }

  @Patch('institutions/:id/status')
  setStatus(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: { status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED' }) {
    return this.service.updateStatus(user, id, body.status);
  }

  @Patch('institutions/:id/subscription')
  setSubscription(
    @CurrentUser() user: RequestUser,
    @Param('id') institutionId: string,
    @Body() body: { planKey: string; status: string; seatLimit?: number },
  ) {
    return this.service.setSubscriptionPlan(user, institutionId, body);
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