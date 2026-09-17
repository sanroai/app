import { Controller, Get, Headers, Param, ParseUUIDPipe, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/auth.decorators';
import { RequestUser } from '../common/types/auth-context';

type ExportBody = { fileName: string; content: string } | undefined;

function sendExport(res: Response, exportBody: ExportBody) {
  if (!exportBody || exportBody.content.length === 0) {
    res.status(200).contentType('application/json').send('[]');
    return;
  }
  res
    .status(200)
    .contentType('text/csv; charset=utf-8')
    .set('Content-Disposition', `attachment; filename="${exportBody.fileName}"`)
    .send(exportBody.content);
}

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Roles('TEACHER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN')
  @Get('class/:groupId')
  async classReport(
    @CurrentUser() user: RequestUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query('institutionId') institutionId: string | undefined,
    @Headers('x-export-format') format: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const report = await this.service.classReport(user, groupId, institutionId);
    if (format === 'csv') {
      sendExport(res, report.csv);
      return;
    }
    return report;
  }

  @Roles('TEACHER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN')
  @Get('student/:studentId')
  async studentReport(
    @CurrentUser() user: RequestUser,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query('institutionId') institutionId: string | undefined,
    @Headers('x-export-format') format: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const report = await this.service.studentReport(user, studentId, institutionId);
    if (format === 'csv') {
      sendExport(res, report.csv);
      return;
    }
    return report;
  }

  @Roles('TEACHER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN')
  @Get('assessment/:assessmentId')
  async assessmentReport(
    @CurrentUser() user: RequestUser,
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
    @Query('institutionId') institutionId: string | undefined,
    @Headers('x-export-format') format: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const report = await this.service.assessmentReport(user, assessmentId, institutionId);
    if (format === 'csv') {
      sendExport(res, report.csv);
      return;
    }
    return report;
  }

  @Roles('TEACHER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN')
  @Get('improvement')
  async improvementReport(
    @CurrentUser() user: RequestUser,
    @Query('institutionId') institutionId: string | undefined,
    @Headers('x-export-format') format: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const report = await this.service.improvementReport(user, institutionId);
    if (format === 'csv') {
      sendExport(res, report.csv);
      return;
    }
    return report;
  }

  @Roles('TEACHER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN')
  @Get('concept-performance')
  async conceptPerformance(
    @CurrentUser() user: RequestUser,
    @Query('institutionId') institutionId: string | undefined,
    @Headers('x-export-format') format: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const report = await this.service.conceptPerformance(user, institutionId);
    if (format === 'csv') {
      sendExport(res, report.csv);
      return;
    }
    return report;
  }
}