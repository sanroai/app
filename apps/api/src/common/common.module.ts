import { Global, Module } from '@nestjs/common';
import { AppConfig, loadConfig } from '../config/app.config';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';
import { SubscriptionAccessService } from '../common/security/subscription-access.service';
import { EntitlementService } from '../common/security/entitlement.service';
import { SystemInstitutionService } from '../common/security/system-institution.service';
import { AuditService, NotificationsService } from '../common/services/audit-notifications.service';
import { StudentIdentityService } from '../common/services/student-identity.service';
import { StudentGradeAccessService } from '../common/services/student-grade-access.service';
import { StorageService } from '../common/services/storage.service';
import { JobQueueService } from '../common/services/job-queue.service';
import { ContentScopeService } from '../common/content/content-scope.service';
import { ResponseCacheService } from '../common/cache/response-cache.service';
import { APP_CONFIG_TOKEN } from './common.constants';

@Global()
@Module({
  providers: [
    {
      provide: APP_CONFIG_TOKEN,
      useFactory: (): AppConfig => loadConfig(),
    },
    PrismaService,
    TenantAccessService,
    SubscriptionAccessService,
    EntitlementService,
    AuditService,
    NotificationsService,
    StudentIdentityService,
    StudentGradeAccessService,
    StorageService,
    JobQueueService,
    ContentScopeService,
    SystemInstitutionService,
    ResponseCacheService,
  ],
  exports: [
    APP_CONFIG_TOKEN,
    PrismaService,
    TenantAccessService,
    SubscriptionAccessService,
    EntitlementService,
    AuditService,
    NotificationsService,
    StudentIdentityService,
    StudentGradeAccessService,
    StorageService,
    JobQueueService,
    ContentScopeService,
    SystemInstitutionService,
    ResponseCacheService,
  ],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class CommonModule {}