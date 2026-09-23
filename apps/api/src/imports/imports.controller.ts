import { Body, Controller, Get, Param, Post, Query, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@sanro/types';
import { ImportsService } from './imports.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles, SubscriptionRequired } from '../common/decorators/auth.decorators';
import { RequestUser } from '../common/types/auth-context';
import { ImportEntityType } from '@sanro/types';
import { memoryStorage } from 'multer';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@ApiTags('imports')
@Controller('imports')
@SubscriptionRequired()
export class ImportsController {
  constructor(private readonly service: ImportsService) {}

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER, Role.SUPER_ADMIN)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_, file, cb) => {
        if (!file.mimetype.match(/spreadsheet|excel|csv|octet-stream/)) {
          cb(new BadRequestException('Only Excel/CSV files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  upload(
    @CurrentUser() user: RequestUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('entityType') entityType: ImportEntityType,
    @Body('academicYearId') academicYearId: string,
    @Body('institutionId') institutionId?: string,
  ) {
    return this.service.preview(
      user,
      entityType as ImportEntityType,
      academicYearId,
      file,
      institutionId,
    );
  }

  @Get()
  history(@CurrentUser() user: RequestUser) {
    return this.service.history(user);
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER, Role.SUPER_ADMIN)
  @Post(':jobId/commit')
  commit(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string) {
    return this.service.commit(user, jobId);
  }

  @Get(':jobId')
  detail(@CurrentUser() user: RequestUser, @Param('jobId') jobId: string, @Query() _q?: unknown) {
    return this.service.jobDetail(user, jobId);
  }
}