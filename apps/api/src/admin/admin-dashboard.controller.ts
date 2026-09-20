import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/auth.decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AdminDashboardService, DashboardRange } from './admin-dashboard.service';

const RangeQuerySchema = z.object({
  range: z.enum(['today', '7d', '30d', 'month']).default('today'),
});
type RangeQuery = z.infer<typeof RangeQuerySchema>;

const HealthQuerySchema = RangeQuerySchema.extend({
  includeSystem: z.enum(['true', 'false']).optional().default('false'),
});
type HealthQuery = z.infer<typeof HealthQuerySchema>;

const ActivityQuerySchema = RangeQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
type ActivityQuery = z.infer<typeof ActivityQuerySchema>;

@ApiTags('admin')
@Controller('admin/super-admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  @Get('overview')
  overview(@Query(new ZodValidationPipe(RangeQuerySchema)) query: RangeQuery) {
    return this.service.overview(query.range as DashboardRange);
  }

  @Get('health')
  health(@Query(new ZodValidationPipe(HealthQuerySchema)) query: HealthQuery) {
    return this.service.health(query.range as DashboardRange, query.includeSystem === 'true');
  }

  @Get('attention')
  attention() {
    return this.service.attention();
  }

  @Get('activity')
  activity(@Query(new ZodValidationPipe(ActivityQuerySchema)) query: ActivityQuery) {
    return this.service.activity(query.range as DashboardRange, query.limit);
  }
}