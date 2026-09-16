import { Body, Controller, Get, Param, Post, Query, UploadedFile, UploadedFiles, UseInterceptors, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Roles } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/types/auth-context';
import { Role } from '@prisma/client';
import { ContentImportService } from './content-import.service';
import { memoryStorage } from 'multer';

const MAX_FILE_SIZE = 50 * 1024 * 1024;

@ApiTags('content-import')
@ApiBearerAuth()
@Controller('content-import')
export class ContentImportController {
  constructor(private readonly service: ContentImportService) {}

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Post('upload')
  @ApiOperation({ summary: 'Upload content file (PDF, video, notes)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  upload(
    @CurrentUser() user: RequestUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
    @Body('description') description?: string,
    @Body('sourceType') sourceType?: string,
    @Body('grade') grade?: string,
    @Body('subject') subject?: string,
    @Body('board') board?: string,
    @Body('chapter') chapter?: string,
  ) {
    return this.service.uploadContent(user, file, {
      name: name || file.originalname.replace(/\.[^.]+$/, ''),
      description,
      sourceType: sourceType || 'PDF_BOOK',
      grade,
      subject,
      board,
      chapter,
    });
  }

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Post('upload-multiple')
  @ApiOperation({ summary: 'Upload multiple content files' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  uploadMultiple(
    @CurrentUser() user: RequestUser,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('names') names: string,
    @Body('sourceType') sourceType?: string,
    @Body('grade') grade?: string,
    @Body('subject') subject?: string,
    @Body('board') board?: string,
  ) {
    const nameList = names ? JSON.parse(names) : [];
    return this.service.uploadMultiple(user, files, {
      names: nameList,
      sourceType: sourceType || 'PDF_BOOK',
      grade,
      subject,
      board,
    });
  }

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Post('youtube')
  @ApiOperation({ summary: 'Add YouTube video content' })
  addYouTube(
    @CurrentUser() user: RequestUser,
    @Body() body: {
      name: string;
      url: string;
      description?: string;
      grade?: string;
      subject?: string;
      board?: string;
      chapter?: string;
    },
  ) {
    return this.service.addYouTubeContent(user, body);
  }

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Get()
  @ApiOperation({ summary: 'List all content imports' })
  list(@CurrentUser() user: RequestUser) {
    return this.service.getImports(user);
  }

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Get(':id')
  @ApiOperation({ summary: 'Get import detail' })
  detail(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.service.getImportDetail(id, user);
  }

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  @Post(':id/process')
  @ApiOperation({ summary: 'Trigger content processing' })
  process(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.service.processContent(id, user);
  }
}
