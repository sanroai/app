import { Global, Module } from '@nestjs/common';
import { AppConfig, loadConfig } from '../config/app.config';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';
import { SubscriptionAccessService } from '../common/security/subscription-access.service';
import { AuditService, NotificationsService } from '../common/services/audit-notifications.service';
import { StudentIdentityService } from '../common/services/student-identity.service';
import { StorageService } from '../common/services/storage.service';
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
    AuditService,
    NotificationsService,
    StudentIdentityService,
    StorageService,
  ],
  exports: [
    APP_CONFIG_TOKEN,
    PrismaService,
    TenantAccessService,
    SubscriptionAccessService,
    AuditService,
    NotificationsService,
    StudentIdentityService,
    StorageService,
  ],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class CommonModule {}