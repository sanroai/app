import { Module } from '@nestjs/common';
import { ArController } from './ar.controller';
import { ArService } from './ar.service';
import { ArValidationService } from './ar-validation.service';

@Module({
  controllers: [ArController],
  providers: [ArService, ArValidationService],
  exports: [ArService],
})
export class ArModule {}
