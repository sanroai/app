import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PdfModule],
  controllers: [FilesController],
})
export class FilesModule {}