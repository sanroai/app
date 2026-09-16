import { Module } from '@nestjs/common';
import { KnowledgeBaseService } from './knowledge-base.service';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { ContentProcessorService } from './content-processor.service';

@Module({
  providers: [KnowledgeBaseService, ContentProcessorService],
  controllers: [KnowledgeBaseController],
  exports: [KnowledgeBaseService, ContentProcessorService],
})
export class KnowledgeBaseModule {}
