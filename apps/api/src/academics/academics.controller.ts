import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AcademicsService } from './academics.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/types/auth-context';

@ApiTags('academics')
@Controller('academics')
export class AcademicsController {
  constructor(private readonly service: AcademicsService) {}

  @Get('academic-years')
  listYears(@CurrentUser() user: RequestUser) {
    return this.service.listAcademicYears(user);
  }

  @Post('academic-years')
  createYear(
    @CurrentUser() user: RequestUser,
    @Body() body: { name: string; startDate: string; endDate: string },
  ) {
    return this.service.createAcademicYear(user, body);
  }

  @Post('academic-years/:id/activate')
  activateYear(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.activateAcademicYear(user, id);
  }

  @Get('groups')
  listGroups(@CurrentUser() user: RequestUser, @Query('academicYearId') yearId?: string) {
    return this.service.listGroups(user, yearId);
  }

  @Post('groups')
  createGroup(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.service.createGroup(user, body as Parameters<typeof this.service.createGroup>[1]);
  }

  @Get('groups/:id')
  groupDetail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.groupDetail(user, id);
  }

  @Patch('groups/:id')
  updateGroup(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: unknown) {
    return this.service.updateGroup(user, id, body as Parameters<typeof this.service.updateGroup>[2]);
  }
}