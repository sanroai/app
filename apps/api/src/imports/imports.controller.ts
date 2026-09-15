import { Body, Controller, Get, Param, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportsService } from './imports.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/types/auth-context';
import { ImportEntityType } from '@sanro/types';
import { memoryStorage } from 'multer';

@ApiTags('imports')
@Controller('imports')
export class ImportsController {
  constructor(private readonly service: ImportsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  upload(
    @CurrentUser() user: RequestUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('entityType') entityType: ImportEntityType,
    @Body('academicYearId') academicYearId: string,
  ) {
    return this.service.preview(user, entityType as ImportEntityType, academicYearId, file);
  }

  @Get()
  history(@CurrentUser() user: RequestUser) {
    return this.service.history(user);
  }

  @Post(':jobId/commit')
  commit(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string) {
    return this.service.commit(user, jobId);
  }

  @Get(':jobId')
  detail(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string, @Query() _q?: unknown) {
    return this.service.jobDetail(user, jobId);
  }
}