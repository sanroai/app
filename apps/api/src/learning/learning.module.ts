import { Module } from '@nestjs/common';
import { LearningController } from './learning.controller';
import { LearningPdfController } from './learning-pdf.controller';
import { LearningService } from './learning.service';
import { PdfTicketService } from './pdf-ticket.service';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { CommonModule } from '../common/common.module';
import { DiagnosisModule } from '../diagnosis/diagnosis.module';

@Module({
  imports: [CurriculumModule, CommonModule, DiagnosisModule],
  controllers: [LearningController, LearningPdfController],
  providers: [LearningService, PdfTicketService],
  exports: [LearningService],
})
export class LearningModule {}
