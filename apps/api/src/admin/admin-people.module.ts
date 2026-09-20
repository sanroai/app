import { Module } from '@nestjs/common';
import { AdminPeopleController } from './admin-people.controller';
import { AdminPeopleService } from './admin-people.service';

@Module({
  controllers: [AdminPeopleController],
  providers: [AdminPeopleService],
  exports: [AdminPeopleService],
})
export class AdminPeopleModule {}