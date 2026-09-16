import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@sanro/types';
import { InstitutionsService } from './institutions.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/auth.decorators';
import { RequestUser } from '../common/types/auth-context';

@ApiTags('institutions')
@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly service: InstitutionsService) {}

  @Get('mine')
  getMine(@CurrentUser() user: RequestUser) {
    return this.service.getForUser(user);
  }

  @Roles(Role.INSTITUTION_ADMIN)
  @Patch('mine')
  updateMine(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.service.updateForUser(user, body as Parameters<typeof this.service.updateForUser>[1]);
  }

  @Get('mine/stats')
  stats(@CurrentUser() user: RequestUser) {
    return this.service.stats(user);
  }
}