import { Module } from '@nestjs/common';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisService } from './diagnosis.service';
import { MasteryService } from './mastery.service';

@Module({
  controllers: [DiagnosisController],
  providers: [DiagnosisService, MasteryService],
  exports: [MasteryService],
})
export class DiagnosisModule {}