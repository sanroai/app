import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  SetMetadata,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { memoryStorage } from 'multer';
import { AR_MODEL_MAX_BYTES, AR_IMAGE_MAX_BYTES } from './ar-validation.service';
import { ArService } from './ar.service';
import { Roles, SubscriptionRequired } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/types/auth-context';
import { ParentContentGuard, PARENT_RESTRICTED_KEY } from '../common/guards/parent-content.guard';

const STAFF = [Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN, Role.TEACHER] as const;

@ApiTags('ar')
@ApiBearerAuth()
@UseGuards(ParentContentGuard)
@Controller('ar')
@SubscriptionRequired()
export class ArController {
  constructor(private readonly service: ArService) {}

  // ==========================================================================
  // Admin management (declared before :id routes)
  // ==========================================================================

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  @Get('admin/list')
  @ApiOperation({ summary: 'List AR content for management' })
  adminList(
    @CurrentUser() user: RequestUser,
    @Query('status') status?: string,
    @Query('conceptId') conceptId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('search') search?: string,
  ) {
    return this.service.adminList(user, { status, conceptId, subjectId, search });
  }

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  @Get('admin/usage')
  @ApiOperation({ summary: 'AR content usage for the institution' })
  usage(@CurrentUser() user: RequestUser, @Query('institutionId') institutionId?: string) {
    return this.service.institutionUsage(user, institutionId);
  }

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  @Post('admin')
  @ApiOperation({ summary: 'Create AR content (starts as DRAFT)' })
  adminCreate(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) {
    return this.service.adminCreate(user, body as any);
  }

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  @Get('admin/:id')
  @ApiOperation({ summary: 'AR content detail (admin)' })
  adminDetail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.adminDetail(user, id);
  }

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  @Patch('admin/:id')
  @ApiOperation({ summary: 'Update AR content metadata' })
  adminUpdate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: Record<string, any>) {
    return this.service.adminUpdate(user, id, body);
  }

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  @Post('admin/:id/model')
  @ApiOperation({ summary: 'Upload the 3D model for AR content' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: AR_MODEL_MAX_BYTES } }))
  uploadModel(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.adminUploadModel(user, id, file);
  }

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  @Post('admin/:id/preview')
  @ApiOperation({ summary: 'Upload the preview image for AR content' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: AR_IMAGE_MAX_BYTES } }))
  uploadPreview(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.adminUploadPreview(user, id, file);
  }

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  @Post('admin/:id/replace')
  @ApiOperation({ summary: 'Replace the 3D model with a new version' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: AR_MODEL_MAX_BYTES } }))
  replaceModel(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.adminReplaceModel(user, id, file);
  }

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  @Post('admin/:id/transition')
  @ApiOperation({ summary: 'Advance the AR content lifecycle status' })
  transition(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: { status: string }) {
    return this.service.adminTransition(user, id, body?.status);
  }

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  @Get('admin/:id/versions')
  @ApiOperation({ summary: 'AR content version history' })
  versions(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.adminVersions(user, id);
  }

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  @Delete('admin/:id')
  @ApiOperation({ summary: 'Delete AR content and its stored assets' })
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.adminDelete(user, id);
  }

  // ==========================================================================
  // Teacher
  // ==========================================================================

  @Roles(...STAFF)
  @Get('teacher')
  @ApiOperation({ summary: 'List published AR content for the staff institution' })
  teacherList(
    @CurrentUser() user: RequestUser,
    @Query('subjectId') subjectId?: string,
    @Query('chapterId') chapterId?: string,
    @Query('conceptId') conceptId?: string,
  ) {
    return this.service.listForTeacher(user, { subjectId, chapterId, conceptId });
  }

  // ==========================================================================
  // Student / learning reads (parent-restricted)
  // ==========================================================================

  @Roles(...STAFF, Role.STUDENT)
  @SetMetadata(PARENT_RESTRICTED_KEY, true)
  @Get('concept/:conceptId')
  @ApiOperation({ summary: 'Published AR content for a concept' })
  listForConcept(@CurrentUser() user: RequestUser, @Param('conceptId') conceptId: string) {
    return this.service.listForConcept(user, conceptId);
  }

  @Roles(...STAFF, Role.STUDENT)
  @SetMetadata(PARENT_RESTRICTED_KEY, true)
  @Get()
  @ApiOperation({ summary: 'Published AR content available to the student' })
  list(
    @CurrentUser() user: RequestUser,
    @Query('subjectId') subjectId?: string,
    @Query('chapterId') chapterId?: string,
    @Query('conceptId') conceptId?: string,
  ) {
    return this.service.listForStudent(user, { subjectId, chapterId, conceptId });
  }

  @Roles(...STAFF, Role.STUDENT)
  @SetMetadata(PARENT_RESTRICTED_KEY, true)
  @Get(':id/quick-check')
  @ApiOperation({ summary: 'Concept-mapped quick check questions (no answers)' })
  quickCheck(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.getQuickCheck(user, id);
  }

  @Roles(...STAFF, Role.STUDENT)
  @SetMetadata(PARENT_RESTRICTED_KEY, true)
  @Post(':id/quick-check')
  @ApiOperation({ summary: 'Submit AR quick check answers' })
  submitQuickCheck(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: { answers: Array<{ questionId: string; optionId?: string; answer?: string }> },
  ) {
    return this.service.submitQuickCheck(user, id, body?.answers ?? []);
  }

  @Roles(...STAFF, Role.STUDENT)
  @SetMetadata(PARENT_RESTRICTED_KEY, true)
  @Post(':id/activity')
  @ApiOperation({ summary: 'Record an AR learning activity event' })
  activity(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: { type: string; sessionId?: string; metadata?: Record<string, unknown> },
  ) {
    return this.service.recordActivity(user, id, body);
  }

  @Roles(...STAFF, Role.STUDENT)
  @SetMetadata(PARENT_RESTRICTED_KEY, true)
  @Get(':id/model-url')
  @ApiOperation({ summary: 'Signed URL for the AR content 3D model' })
  modelUrl(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.getModelUrl(user, id);
  }

  @Roles(...STAFF, Role.STUDENT)
  @SetMetadata(PARENT_RESTRICTED_KEY, true)
  @Get(':id')
  @ApiOperation({ summary: 'Published AR content detail' })
  detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.getDetail(user, id);
  }
}
