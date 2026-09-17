import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CommonModule } from './common/common.module';
import { APP_CONFIG_TOKEN } from './common/common.constants';
import { AppConfig } from './config/app.config';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HealthController } from './health/health.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { AcademicsModule } from './academics/academics.module';
import { PeopleModule } from './people/people.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { QuestionsModule } from './questions/questions.module';
import { PapersModule } from './papers/papers.module';
import { PdfModule } from './pdf/pdf.module';
import { FilesModule } from './files/files.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { DiagnosisModule } from './diagnosis/diagnosis.module';
import { RemediationModule } from './remediation/remediation.module';
import { AiModule } from './ai/ai.module';
import { ImportsModule } from './imports/imports.module';
import { ChatModule } from './chat/chat.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AdminModule } from './admin/admin.module';
import { LearningModule } from './learning/learning.module';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';
import { ArModule } from './ar/ar.module';
import { SiteModule } from './site/site.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    CommonModule,
    JwtModule.registerAsync({
      global: true,
      inject: [APP_CONFIG_TOKEN],
      useFactory: (config: AppConfig) => ({
        secret: config.AUTH_SECRET,
        signOptions: {
          issuer: config.AUTH_ISSUER,
          audience: 'sanro-app',
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [APP_CONFIG_TOKEN],
      useFactory: (config: AppConfig) => [
        {
          ttl: config.RATE_LIMIT_TTL_MS,
          limit: config.RATE_LIMIT_MAX,
        },
      ],
    }),
    AuthModule,
    UsersModule,
    InstitutionsModule,
    AcademicsModule,
    PeopleModule,
    CurriculumModule,
    QuestionsModule,
    PapersModule,
    PdfModule,
    FilesModule,
    AssessmentsModule,
    DiagnosisModule,
    RemediationModule,
    AiModule,
    ImportsModule,
    ChatModule,
    DashboardModule,
    AdminModule,
    LearningModule,
    KnowledgeBaseModule,
    ArModule,
    SiteModule,
    ReportsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AppModule {}