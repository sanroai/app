import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@sanro/types';
import { RemediationService } from './remediation.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles, SubscriptionRequired } from '../common/decorators/auth.decorators';
import { RequestUser } from '../common/types/auth-context';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UpdateRemediationItemSchema, CreateRetestSchema } from '@sanro/validation';

@ApiTags('remediation')
@Controller('remediation')
@SubscriptionRequired()
export class RemediationController {
  constructor(private readonly service: RemediationService) {}

  @Get('my')
  my(@CurrentUser() user: RequestUser) {
    return this.service.listForStudent(user);
  }

  @Get('plans')
  plans(@CurrentUser() user: RequestUser, @Query('studentId') studentId?: string) {
    return this.service.listForTeacher(user, studentId);
  }

  @Get('weak')
  weak(@CurrentUser() user: RequestUser, @Query('studentId') studentId?: string) {
    return this.service.detectWeakConcepts(user, studentId);
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Post('items/:id/status')
  setItemStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateRemediationItemSchema)) body: { status: 'COMPLETED' | 'SKIPPED' },
  ) {
    return this.service.updateItemStatus(user, id, body.status);
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER, Role.STUDENT)
  @Post('retest')
  createRetest(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(CreateRetestSchema)) body: { studentId?: string; conceptIds: string[] },
  ) {
    return this.service.createRetest(user, body.studentId, body.conceptIds);
  }
}