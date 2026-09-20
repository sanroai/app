import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { Role } from '@sanro/types';
import { CurriculumService } from './curriculum.service';
import { ContentService } from './content.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles, SubscriptionRequired } from '../common/decorators/auth.decorators';
import { RequestUser } from '../common/types/auth-context';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@ApiTags('curriculum')
@Controller('curriculum')
@SubscriptionRequired()
export class CurriculumController {
  constructor(private readonly service: CurriculumService) {}

  @Get('boards')
  boards(@CurrentUser() user: RequestUser) {
    return this.service.listBoards(user);
  }

  @Get('grades')
  grades(@CurrentUser() user: RequestUser, @Query('boardId') boardId?: string) {
    return this.service.listGrades(user, boardId);
  }

  @Get('subjects')
  subjects(@CurrentUser() user: RequestUser, @Query('boardId') boardId: string, @Query('grade') grade?: string) {
    return this.service.listSubjects(user, boardId, grade);
  }

  @Get('chapters')
  chapters(@CurrentUser() user: RequestUser, @Query('subjectId') subjectId?: string) {
    if (!subjectId) throw new BadRequestException('subjectId is required');
    return this.service.listChapters(user, subjectId);
  }

  @Get('topics')
  topics(@CurrentUser() user: RequestUser, @Query('chapterId') chapterId: string) {
    return this.service.listTopics(user, chapterId);
  }

  @Get('concepts')
  concepts(@CurrentUser() user: RequestUser, @Query('topicId') topicId: string) {
    return this.service.listConcepts(user, topicId);
  }

  @Get('tree')
  tree(@CurrentUser() user: RequestUser, @Query('boardId') boardId?: string, @Query('grade') grade?: string, @Query('subjectId') subjectId?: string) {
    return this.service.tree(user, boardId, grade, subjectId);
  }

  @Roles(Role.SUPER_ADMIN)
  @Post('boards')
  createBoard(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(z.object({ name: z.string().trim().min(2).max(200), code: z.string().trim().min(1).max(20) }))) body: { name: string; code: string }) {
    return this.service.createBoard(user, body);
  }

  @Roles(Role.SUPER_ADMIN)
  @Post('subjects')
  createSubject(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.service.createSubject(user, body as Parameters<typeof this.service.createSubject>[1]);
  }

  @Roles(Role.SUPER_ADMIN)
  @Post('chapters')
  createChapter(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.service.createChapter(user, body as Parameters<typeof this.service.createChapter>[1]);
  }

  @Roles(Role.SUPER_ADMIN)
  @Post('topics')
  createTopic(@CurrentUser() user: RequestUser, @Body() body: { chapterId: string; name: string; order?: number }) {
    return this.service.createTopic(user, body);
  }

  @Roles(Role.SUPER_ADMIN)
  @Post('concepts')
  createConcept(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.service.createConcept(user, body as Parameters<typeof this.service.createConcept>[1]);
  }

  @Roles(Role.SUPER_ADMIN)
  @Post('grades')
  createGrade(@CurrentUser() user: RequestUser, @Body() body: { boardId: string; name: string; order?: number }) {
    return this.service.createGrade(user, body);
  }
}

@ApiTags('content')
@Controller('content')
@SubscriptionRequired()
export class ContentController {
  constructor(private readonly service: ContentService) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Query() q: Record<string, string | undefined>) {
    return this.service.list(user, q);
  }

  @Get(':id')
  detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.detail(user, id);
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Post()
  create(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.service.create(user, body as Parameters<typeof this.service.create>[1]);
  }

  @Post(':id/progress')
  updateProgress(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: { state: string; secondsWatched?: number }) {
    return this.service.recordProgress(user, id, body);
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.SUPER_ADMIN)
  @Patch(':id/status')
  updateStatus(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: { status: string }) {
    return this.service.updateStatus(user, id, body.status as any);
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER, Role.SUPER_ADMIN)
  @Get('matrix/completeness')
  completeness(@CurrentUser() user: RequestUser, @Query('boardId') boardId?: string, @Query('grade') grade?: string) {
    return this.service.completenessMatrix(user, boardId, grade);
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER, Role.SUPER_ADMIN)
  @Get('report/quality')
  quality(@CurrentUser() user: RequestUser) {
    return this.service.qualityReport(user);
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER, Role.SUPER_ADMIN)
  @Get(':id/versions')
  versions(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.getVersionHistory(user, id);
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.SUPER_ADMIN)
  @Post(':id/versions/:version/restore')
  restoreVersion(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('version') version: string) {
    return this.service.restoreVersion(user, id, parseInt(version, 10));
  }
}