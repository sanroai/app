import { Module } from '@nestjs/common';
import { ContentController, CurriculumController } from './curriculum.controller';
import { CurriculumService } from './curriculum.service';
import { ContentService } from './content.service';

@Module({
  controllers: [CurriculumController, ContentController],
  providers: [CurriculumService, ContentService],
  exports: [CurriculumService, ContentService],
})
export class CurriculumModule {}