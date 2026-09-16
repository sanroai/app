import { Global, Module } from '@nestjs/common';
import { AppConfig } from '../config/app.config';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';
import { AuditService, NotificationsService } from '../common/services/audit-notifications.service';
import { StudentIdentityService } from '../common/services/student-identity.service';

export const APP_CONFIG_TOKEN = 'APP_CONFIG';

@Global()
@Module({
  providers: [
    {
      provide: APP_CONFIG_TOKEN,
      useFactory: (): AppConfig => {
        const env = process.env;
        return {
          NODE_ENV: (env.NODE_ENV as AppConfig['NODE_ENV']) ?? 'development',
          APP_NAME: env.APP_NAME ?? 'Sanro AI',
          APP_URL: env.APP_URL ?? 'http://localhost:3000',
          API_URL: env.API_URL ?? 'http://localhost:4000',
          API_PORT: Number(env.API_PORT ?? 4000),
          CORS_ORIGINS: (env.CORS_ORIGINS ?? '')
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean),
          DATABASE_URL: env.DATABASE_URL ?? '',
          AUTH_SECRET: env.AUTH_SECRET ?? 'dev-only-secret-change-me',
          AUTH_TOKEN_EXPIRES_IN: env.AUTH_TOKEN_EXPIRES_IN ?? '7d',
          AUTH_REFRESH_EXPIRES_IN: env.AUTH_REFRESH_EXPIRES_IN ?? '30d',
          AUTH_ISSUER: env.AUTH_ISSUER ?? 'sanro-api',
          AI_API_KEY: env.AI_API_KEY ?? '',
          AI_MODEL: env.AI_MODEL ?? 'gpt-4o-mini',
          AI_PROVIDER: (env.AI_PROVIDER as AppConfig['AI_PROVIDER']) ?? 'mock',
          AI_BASE_URL: env.AI_BASE_URL ?? 'https://api.openai.com/v1',
          STORAGE_TYPE: (env.STORAGE_TYPE as AppConfig['STORAGE_TYPE']) ?? 'local',
          STORAGE_URL: env.STORAGE_URL ?? '',
          STORAGE_KEY: env.STORAGE_KEY ?? '',
          STORAGE_SECRET: env.STORAGE_SECRET ?? '',
          STORAGE_BUCKET: env.STORAGE_BUCKET ?? '',
          RATE_LIMIT_TTL_MS: Number(env.RATE_LIMIT_TTL_MS ?? 60000),
          RATE_LIMIT_MAX: Number(env.RATE_LIMIT_MAX ?? 120),
          PDF_ENGINE: (env.PDF_ENGINE as AppConfig['PDF_ENGINE']) ?? 'chrome',
          SEED_SUPER_ADMIN_EMAIL: env.SEED_SUPER_ADMIN_EMAIL ?? '',
          SEED_SUPER_ADMIN_PASSWORD: env.SEED_SUPER_ADMIN_PASSWORD ?? '',
        };
      },
    },
    PrismaService,
    TenantAccessService,
    AuditService,
    NotificationsService,
    StudentIdentityService,
  ],
  exports: [APP_CONFIG_TOKEN, PrismaService, TenantAccessService, AuditService, NotificationsService, StudentIdentityService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class CommonModule {}