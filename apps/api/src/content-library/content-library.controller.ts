import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { ContentLibraryService } from './content-library.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/auth.decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RequestUser } from '../common/types/auth-context';

const ContentTypes = ['VIDEO', 'NOTES', 'PDF', 'QUIZ', 'MODEL_3D', 'AR', 'GAME', 'PRACTICE_SET', 'ARTICLE', 'IMAGE', 'WORKSHEET', 'REVISION', 'FLASHCARDS', 'INTERACTIVE', 'EXAMPLE', 'READING', 'OTHER'] as const;
const ContentStatuses = ['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED'] as const;

const ContentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
  boardId: z.string().uuid().optional(),
  grade: z.string().trim().max(10).optional(),
  subjectId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
  conceptId: z.string().uuid().optional(),
  type: z.enum(ContentTypes).optional(),
  status: z.enum(ContentStatuses).optional(),
  ownerType: z.enum(['PLATFORM', 'INSTITUTION']).optional(),
  institutionId: z.string().uuid().optional(),
  availableOnDirect: z.enum(['true', 'false']).optional(),
});
type ContentQuery = z.infer<typeof ContentQuerySchema>;

const CreateContentSchema = z.object({
  type: z.enum(ContentTypes),
  title: z.string().trim().min(3).max(300),
  description: z.string().trim().max(3000).optional(),
  durationSeconds: z.coerce.number().int().min(0).max(86400).optional(),
  thumbnailUrl: z.string().trim().url().max(1000).optional(),
  url: z.string().trim().max(1000).optional(),
  videoId: z.string().trim().max(40).optional(),
  grade: z.string().trim().max(10).optional(),
  boardId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
  topicId: z.string().uuid().optional(),
  conceptId: z.string().uuid().optional(),
  visibility: z.enum(['PUBLIC', 'INSTITUTION_ONLY', 'PRIVATE']).optional(),
  language: z.enum(['EN', 'HI', 'MR']).optional(),
  order: z.coerce.number().int().min(0).optional(),
  storageKey: z.string().trim().max(1000).optional(),
  sourceType: z.enum(['PDF_BOOK', 'VIDEO', 'NOTES', 'WEBSITE', 'YOUTUBE']).optional(),
  directSanroAvailable: z.boolean().optional(),
});

const UpdateContentSchema = CreateContentSchema.partial();

const TransitionSchema = z.object({
  to: z.enum(ContentStatuses),
  note: z.string().trim().max(1000).optional(),
});

const AssignSchema = z.object({ institutionId: z.string().uuid() });

const AvailabilitySchema = z.object({ directSanroAvailable: z.boolean() });

@ApiTags('admin-library')
@Roles('SUPER_ADMIN', 'INSTITUTION_ADMIN', 'TEACHER')
@Controller('admin/library')
export class ContentLibraryController {
  constructor(private readonly service: ContentLibraryService) {}

  @Get('content')
  list(@CurrentUser() user: RequestUser, @Query(new ZodValidationPipe(ContentQuerySchema)) query: ContentQuery) {
    return this.service.list(user, {
      ...query,
      availableOnDirect: query.availableOnDirect === undefined ? undefined : query.availableOnDirect === 'true',
    });
  }

  @Get('content/:id')
  detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.detail(user, id);
  }

  @Post('content')
  create(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(CreateContentSchema)) body: z.infer<typeof CreateContentSchema>) {
    return this.service.create(user, body);
  }

  @Patch('content/:id')
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(UpdateContentSchema)) body: Record<string, unknown>) {
    return this.service.update(user, id, body);
  }

  @Post('content/:id/transition')
  transition(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(TransitionSchema)) body: { to: z.infer<typeof TransitionSchema>['to']; note?: string },
  ) {
    return this.service.transition(user, id, body.to, body.note);
  }

  @Post('content/:id/assign')
  assign(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(AssignSchema)) body: { institutionId: string }) {
    return this.service.assign(user, id, body.institutionId);
  }

  @Delete('content/:id/assign/:institutionId')
  unassign(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('institutionId') institutionId: string) {
    return this.service.unassign(user, id, institutionId);
  }

  @Post('content/:id/archive')
  archive(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.archive(user, id);
  }

  @Delete('content/:id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.remove(user, id);
  }

  @Patch('content/:id/availability')
  setAvailability(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(AvailabilitySchema)) body: { directSanroAvailable: boolean }) {
    return this.service.setAvailability(user, id, body.directSanroAvailable);
  }

  @Get('assignments')
  listAssignments(@CurrentUser() user: RequestUser, @Query('institutionId') institutionId?: string) {
    return this.service.listAssignments(user, institutionId);
  }
}