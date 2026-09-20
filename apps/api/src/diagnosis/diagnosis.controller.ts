import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DiagnosisService } from './diagnosis.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SubscriptionRequired } from '../common/decorators/auth.decorators';
import { RequestUser } from '../common/types/auth-context';

@ApiTags('diagnosis')
@Controller('diagnosis')
@SubscriptionRequired()
export class DiagnosisController {
  constructor(private readonly service: DiagnosisService) {}

  @Get('my')
  my(@CurrentUser() user: RequestUser) {
    return this.service.myMastery(user);
  }

  @Get('students/:studentId')
  student(@CurrentUser() user: RequestUser, @Param('studentId') id: string) {
    return this.service.studentMastery(user, id);
  }

  @Get('concepts/:conceptId/distribution')
  distribution(@CurrentUser() user: RequestUser, @Param('conceptId') id: string, @Query() _q?: unknown) {
    return this.service.conceptDistribution(user, id);
  }
}