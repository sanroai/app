import { Module } from '@nestjs/common';
import { KnowledgeBaseService } from './knowledge-base.service';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { ContentProcessorService } from './content-processor.service';
import { ContentGeneratorService } from './content-generator.service';

@Module({
  providers: [KnowledgeBaseService, ContentProcessorService, ContentGeneratorService],
  controllers: [KnowledgeBaseController],
  exports: [KnowledgeBaseService, ContentProcessorService, ContentGeneratorService],
})
export class KnowledgeBaseModule {}
