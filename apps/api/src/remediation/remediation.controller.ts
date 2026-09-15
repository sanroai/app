import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RemediationService } from './remediation.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/types/auth-context';

@ApiTags('remediation')
@Controller('remediation')
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
    return this.service.detectWeakConcepts(user, studentId ?? '');
  }

  @Post('items/:id/status')
  setItemStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: { status: 'COMPLETED' | 'SKIPPED' },
  ) {
    return this.service.updateItemStatus(user, id, body.status);
  }

  @Post('retest')
  createRetest(@CurrentUser() user: RequestUser, @Body() body: { studentId: string; conceptIds: string[] }) {
    return this.service.createRetest(user, body.studentId, body.conceptIds);
  }
}