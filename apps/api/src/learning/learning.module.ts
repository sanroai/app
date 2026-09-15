import { Module } from '@nestjs/common';
import { LearningController } from './learning.controller';
import { LearningService } from './learning.service';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { CommonModule } from '../common/common.module';
import { DiagnosisModule } from '../diagnosis/diagnosis.module';

@Module({
  imports: [CurriculumModule, CommonModule, DiagnosisModule],
  controllers: [LearningController],
  providers: [LearningService],
  exports: [LearningService],
})
export class LearningModule {}
