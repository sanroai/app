import { Module } from '@nestjs/common';
import { ContentLibraryService } from './content-library.service';
import { ContentLibraryController } from './content-library.controller';
import { ContentPipelineService } from './content-pipeline.service';
import { EmbeddingService } from './embedding.service';
import { ContentIngestController } from './content-ingest.controller';

@Module({
  providers: [ContentLibraryService, ContentPipelineService, EmbeddingService],
  controllers: [ContentLibraryController, ContentIngestController],
  exports: [ContentLibraryService, ContentPipelineService],
})
export class ContentLibraryModule {}