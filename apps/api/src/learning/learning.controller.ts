import { Controller, Get, Param, Post, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LearningService } from './learning.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/auth.decorators';
import { RequestUser } from '../common/types/auth-context';

@ApiTags('learning')
@Controller('learning')
export class LearningController {
  constructor(private readonly service: LearningService) {}

  @Get('home')
  home(@CurrentUser() user: RequestUser) {
    return this.service.getLearningHome(user);
  }

  @Get('boards/:boardId/grades/:grade/subjects/:subjectId/chapters')
  chapters(
    @CurrentUser() user: RequestUser,
    @Param('boardId') boardId: string,
    @Param('grade') grade: string,
    @Param('subjectId') subjectId: string,
  ) {
    return this.service.getChapters(user, boardId, grade, subjectId);
  }

  @Get('chapters/:chapterId')
  chapterDetail(@CurrentUser() user: RequestUser, @Param('chapterId') chapterId: string) {
    return this.service.getChapterDetail(user, chapterId);
  }

  @Get('concepts/:conceptId')
  conceptDetail(@CurrentUser() user: RequestUser, @Param('conceptId') conceptId: string) {
    return this.service.getConceptDetail(user, conceptId);
  }

  @Post('content/:contentId/complete')
  completeContent(@CurrentUser() user: RequestUser, @Param('contentId') contentId: string) {
    return this.service.completeContent(user, contentId);
  }

  @Get('progress')
  progress(@CurrentUser() user: RequestUser) {
    return this.service.getLearningProgress(user);
  }

  @Roles('STUDENT')
  @Post('practice/start')
  startPractice(
    @CurrentUser() user: RequestUser,
    @Body() body: { conceptId: string; questionCount?: number },
  ) {
    return this.service.startPractice(user, body.conceptId, body.questionCount ?? 5);
  }

  @Roles('STUDENT')
  @Get('practice/:practiceId')
  getPractice(
    @CurrentUser() user: RequestUser,
    @Param('practiceId') practiceId: string,
  ) {
    return this.service.getPractice(user, practiceId);
  }

  @Roles('STUDENT')
  @Post('practice/:practiceId/answer')
  savePracticeAnswer(
    @CurrentUser() user: RequestUser,
    @Param('practiceId') practiceId: string,
    @Body() body: { questionId: string; answer: string },
  ) {
    return this.service.savePracticeAnswer(user, practiceId, body.questionId, body.answer);
  }

  @Roles('STUDENT')
  @Post('practice/:practiceId/submit')
  submitPractice(
    @CurrentUser() user: RequestUser,
    @Param('practiceId') practiceId: string,
  ) {
    return this.service.submitPractice(user, practiceId);
  }

  @Get('gamification/profile')
  gamificationProfile(@CurrentUser() user: RequestUser) {
    return this.service.getGamificationProfile(user);
  }

  @Get('gamification/leaderboard')
  leaderboard(@CurrentUser() user: RequestUser, @Query('period') period?: string) {
    return this.service.getLeaderboard(user, period ?? 'weekly');
  }

  @Get('gamification/achievements')
  achievements(@CurrentUser() user: RequestUser) {
    return this.service.getAchievements(user);
  }
}
