import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/types/auth-context';
import { Role } from '@prisma/client';
import { KnowledgeBaseService } from './knowledge-base.service';

@ApiTags('knowledge-base')
@ApiBearerAuth()
@Controller('knowledge-base')
export class KnowledgeBaseController {
  constructor(private readonly service: KnowledgeBaseService) {}

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Post()
  @ApiOperation({ summary: 'Create a knowledge base' })
  create(@CurrentUser() user: RequestUser, @Body() body: {
    name: string;
    description?: string;
    sourceType: string;
    sourceUrl?: string;
    storageKey?: string;
    metadata?: any;
  }) {
    return this.service.create(user, body);
  }

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Get()
  @ApiOperation({ summary: 'List knowledge bases' })
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('status') status?: string,
    @Query('sourceType') sourceType?: string,
  ) {
    return this.service.findAll(user, { status, sourceType });
  }

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Get('stats')
  @ApiOperation({ summary: 'Knowledge base statistics' })
  getStats(@CurrentUser() user: RequestUser) {
    return this.service.getStats(user);
  }

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Get('search')
  @ApiOperation({ summary: 'Search knowledge chunks' })
  search(
    @CurrentUser() user: RequestUser,
    @Query('q') query: string,
    @Query('grade') grade?: string,
    @Query('subject') subject?: string,
    @Query('board') board?: string,
  ) {
    return this.service.search(user, query, { grade, subject, board });
  }

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Get(':id')
  @ApiOperation({ summary: 'Get knowledge base detail' })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.service.findOne(id, user);
  }

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Post(':id/chunks')
  @ApiOperation({ summary: 'Add chunks to knowledge base' })
  addChunks(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() body: { chunks: Array<{
      content: string;
      chapter?: string;
      topic?: string;
      concept?: string;
      grade?: string;
      subject?: string;
      board?: string;
      metadata?: any;
    }> },
  ) {
    return this.service.addChunks(id, user, body.chunks);
  }

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update knowledge base status' })
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() body: { status: string },
  ) {
    return this.service.updateStatus(id, user, body.status);
  }

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete knowledge base' })
  delete(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.service.delete(id, user);
  }
}
