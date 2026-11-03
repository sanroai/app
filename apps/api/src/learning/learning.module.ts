import { Module } from '@nestjs/common';
import { LearningController } from './learning.controller';
import { LearningPdfController } from './learning-pdf.controller';
import { LearningService } from './learning.service';
import { ReviewService } from './review.service';
import { PdfTicketService } from './pdf-ticket.service';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { CommonModule } from '../common/common.module';
import { DiagnosisModule } from '../diagnosis/diagnosis.module';

@Module({
  imports: [CurriculumModule, CommonModule, DiagnosisModule],
  controllers: [LearningController, LearningPdfController],
  providers: [LearningService, ReviewService, PdfTicketService],
  exports: [LearningService, ReviewService],
})
export class LearningModule {}
