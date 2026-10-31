import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AssessmentsService } from './assessments.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SubscriptionRequired } from '../common/decorators/auth.decorators';
import { RequestUser } from '../common/types/auth-context';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AssignAssessmentSchema, CreateAssessmentSchema, SubmitAnswerBatchSchema } from '@sanro/validation';

@ApiTags('assessments')
@Controller('assessments')
@SubscriptionRequired()
export class AssessmentsController {
  constructor(private readonly service: AssessmentsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Query('institutionId') institutionId?: string) {
    return this.service.list(user, institutionId);
  }

  @Get('my')
  my(@CurrentUser() user: RequestUser) {
    return this.service.myAssignments(user);
  }

  @Get('attempts/:attemptId')
  attemptDetail(@CurrentUser() user: RequestUser, @Param('attemptId') attemptId: string) {
    return this.service.attemptDetail(user, attemptId);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(CreateAssessmentSchema)) data: unknown) {
    return this.service.create(user, data as Parameters<typeof this.service.create>[1]);
  }

  @Get(':id')
  detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.detail(user, id);
  }

  /** The paper as the student will see it, without starting an attempt. */
  @Get(':id/paper')
  paper(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.paperForStudent(user, id);
  }

  @Post(':id/publish')
  publish(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AssignAssessmentSchema)) data: { groupIds: string[]; studentIds: string[] },
  ) {
    return this.service.publish(user, id, data.groupIds, data.studentIds);
  }

  @Get(':id/attempts')
  attempts(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query('studentId') studentId?: string) {
    return this.service.attemptsForAssessment(user, id);
  }

  @Post(':id/start')
  start(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.startAttempt(user, id);
  }

  @Post('attempts/:attemptId/answers')
  saveAnswers(
    @CurrentUser() user: RequestUser,
    @Param('attemptId') attemptId: string,
    @Body(new ZodValidationPipe(SubmitAnswerBatchSchema)) data: { answers: Array<{ snapshotQuestionId: string; answer: string }> },
  ) {
    return this.service.saveAnswers(user, attemptId, data.answers);
  }

  @Post('attempts/:attemptId/submit')
  submit(@CurrentUser() user: RequestUser, @Param('attemptId') attemptId: string) {
    return this.service.submitAttempt(user, attemptId);
  }

  /**
   * Grade one written answer. `gradeAnswer` existed on the service but had no
   * route, so a subjective paper could never leave "pending review".
   */
  @Post('attempts/:attemptId/answers/:answerId/grade')
  gradeAnswer(
    @CurrentUser() user: RequestUser,
    @Param('attemptId') attemptId: string,
    @Param('answerId') answerId: string,
    @Body() body: { marksAwarded: number },
  ) {
    return this.service.gradeAnswer(user, attemptId, answerId, Number(body?.marksAwarded));
  }
}