import { Module } from '@nestjs/common';
import { ParentsController, StudentsController, TeachersController } from './people.controller';
import { StudentsService } from './students.service';
import { TeachersService } from './teachers.service';
import { ParentsService } from './parents.service';

@Module({
  controllers: [StudentsController, TeachersController, ParentsController],
  providers: [StudentsService, TeachersService, ParentsService],
  exports: [StudentsService],
})
export class PeopleModule {}