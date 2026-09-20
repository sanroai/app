import { Body, BadRequestException, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { Role } from '@sanro/types';
import { Roles } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RequestUser } from '../common/types/auth-context';
import { AdminCurriculumService } from './admin-curriculum.service';

const kinds = ['boards', 'grades', 'subjects', 'chapters', 'topics', 'concepts'] as const;
type Kind = (typeof kinds)[number];

function kindParam(value: string): Kind {
  if (!(kinds as readonly string[]).includes(value)) throw new BadRequestException('Invalid node kind');
  return value as Kind;
}

@ApiTags('admin-curriculum')
@Controller('admin/curriculum')
@Roles(Role.SUPER_ADMIN)
export class AdminCurriculumController {
  constructor(private readonly service: AdminCurriculumService) {}

  @Patch('nodes/:kind/:id')
  updateNode(
    @Param('kind') kind: string,
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.updateNode(user, kindParam(kind), id, body);
  }

  @Delete('nodes/:kind/:id')
  deleteNode(@Param('kind') kind: string, @Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.service.deleteNode(user, kindParam(kind), id);
  }

  @Post('import/preview')
  @UseInterceptors(FileInterceptor('file'))
  async importPreview(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: RequestUser) {
    return this.service.previewImport(user, file);
  }

  @Get('import/:jobId')
  importDetail(@Param('jobId') jobId: string, @CurrentUser() user: RequestUser) {
    return this.service.importDetail(user, jobId);
  }

  @Post('import/:jobId/commit')
  importCommit(@Param('jobId') jobId: string, @CurrentUser() user: RequestUser) {
    return this.service.commitImport(user, jobId);
  }

  @Get('access')
  listAccess(@CurrentUser() user: RequestUser, @Query('institutionId') institutionId?: string) {
    return this.service.listAccess(user, institutionId);
  }

  @Post('access')
  grantAccess(
    @CurrentUser() user: RequestUser,
    @Body(
      new ZodValidationPipe(
        z
          .object({
            institutionId: z.string().min(1),
            boardId: z.string().min(1),
            grade: z.string().trim().min(1).max(50).optional().nullable(),
            subjectId: z.string().min(1).optional().nullable(),
          })
          .strict(),
      ),
    )
    body: { institutionId: string; boardId: string; grade?: string | null; subjectId?: string | null },
  ) {
    return this.service.grantAccess(user, {
      institutionId: body.institutionId,
      boardId: body.boardId,
      grade: body.grade ?? undefined,
      subjectId: body.subjectId ?? undefined,
    });
  }

  @Delete('access/:id')
  revokeAccess(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.service.revokeAccess(user, id);
  }
}