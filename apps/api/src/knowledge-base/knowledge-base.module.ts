import { Module } from '@nestjs/common';
import { KnowledgeBaseService } from './knowledge-base.service';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { ContentProcessorService } from './content-processor.service';
import { ContentGeneratorService } from './content-generator.service';
import { JobQueueService } from '../common/services/job-queue.service';

@Module({
  providers: [KnowledgeBaseService, ContentProcessorService, ContentGeneratorService, JobQueueService],
  controllers: [KnowledgeBaseController],
  exports: [KnowledgeBaseService, ContentProcessorService, ContentGeneratorService, JobQueueService],
})
export class KnowledgeBaseModule {}
