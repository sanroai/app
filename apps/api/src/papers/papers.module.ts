import { Module } from '@nestjs/common';
import { PapersController } from './papers.controller';
import { PapersService } from './papers.service';
import { PdfModule } from '../pdf/pdf.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PdfModule, AiModule],
  controllers: [PapersController],
  providers: [PapersService],
  exports: [PapersService],
})
export class PapersModule {}