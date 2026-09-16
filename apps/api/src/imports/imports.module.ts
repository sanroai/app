import { Module } from '@nestjs/common';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
import { ContentImportController } from './content-import.controller';
import { ContentImportService } from './content-import.service';

@Module({
  controllers: [ImportsController, ContentImportController],
  providers: [ImportsService, ContentImportService],
  exports: [ImportsService, ContentImportService],
})
export class ImportsModule {}
