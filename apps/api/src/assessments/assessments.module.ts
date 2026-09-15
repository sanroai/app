import { Module } from '@nestjs/common';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import { RemediationModule } from '../remediation/remediation.module';
import { DiagnosisModule } from '../diagnosis/diagnosis.module';

@Module({
  imports: [RemediationModule, DiagnosisModule],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}