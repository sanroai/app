import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@sanro/types';
import { CurriculumService } from './curriculum.service';
import { ContentService } from './content.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/auth.decorators';
import { RequestUser } from '../common/types/auth-context';

@ApiTags('curriculum')
@Controller('curriculum')
export class CurriculumController {
  constructor(private readonly service: CurriculumService) {}

  @Get('boards')
  boards() {
    return this.service.listBoards();
  }

  @Get('grades')
  grades(@Query('boardId') boardId?: string) {
    return this.service.listGrades(boardId);
  }

  @Get('subjects')
  subjects(@Query('boardId') boardId: string, @Query('grade') grade?: string) {
    return this.service.listSubjects(boardId, grade);
  }

  @Get('chapters')
  chapters(@Query('subjectId') subjectId: string) {
    return this.service.listChapters(subjectId);
  }

  @Get('topics')
  topics(@Query('chapterId') chapterId: string) {
    return this.service.listTopics(chapterId);
  }

  @Get('concepts')
  concepts(@Query('topicId') topicId: string) {
    return this.service.listConcepts(topicId);
  }

  @Get('tree')
  tree(@CurrentUser() user: RequestUser, @Query('boardId') boardId?: string, @Query('grade') grade?: string, @Query('subjectId') subjectId?: string) {
    return this.service.tree(user, boardId, grade, subjectId);
  }

  @Roles(Role.INSTITUTION_ADMIN)
  @Post('boards')
  createBoard(@CurrentUser() user: RequestUser, @Body() body: { name: string; code: string }) {
    return this.service.createBoard(user, body);
  }

  @Roles(Role.INSTITUTION_ADMIN)
  @Post('subjects')
  createSubject(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.service.createSubject(user, body as Parameters<typeof this.service.createSubject>[1]);
  }

  @Roles(Role.INSTITUTION_ADMIN)
  @Post('chapters')
  createChapter(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.service.createChapter(user, body as Parameters<typeof this.service.createChapter>[1]);
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Post('topics')
  createTopic(@CurrentUser() user: RequestUser, @Body() body: { chapterId: string; name: string; order?: number }) {
    return this.service.createTopic(user, body);
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Post('concepts')
  createConcept(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.service.createConcept(user, body as Parameters<typeof this.service.createConcept>[1]);
  }
}

@ApiTags('content')
@Controller('content')
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
}