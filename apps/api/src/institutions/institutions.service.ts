import { ForbiddenException, Injectable } from '@nestjs/common';
import { TenantAccessService } from '../common/security/tenant-access.service';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit-notifications.service';

@Injectable()
export class InstitutionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
    private readonly audit: AuditService,
  ) {}

  async getForUser(user: RequestUser) {
    const institutionId = this.tenant.requireInstitution(user);
    return this.prisma.institution.findUnique({
      where: { id: institutionId },
      include: {
        subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  async updateForUser(user: RequestUser, data: Partial<{
    name: string;
    type: 'SCHOOL' | 'COACHING_CENTRE';
    address: string;
    city: string;
    state: string;
    primaryPhone: string;
    primaryEmail: string;
    logoUrl: string;
  }>) {
    const institutionId = this.tenant.requireInstitution(user);
    if (user.role !== 'INSTITUTION_ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only institution admins can update institution settings');
    }
    const updated = await this.prisma.institution.update({
      where: { id: institutionId },
      data: data as object,
    });
    return updated;
  }

  async stats(user: RequestUser) {
    const institutionId = this.tenant.requireInstitution(user);
    const [activeStudents, activeTeachers, groups, assessments, avgScore] = await Promise.all([
      this.prisma.student.count({ where: { institutionId, status: 'ACTIVE' } }),
      this.prisma.institutionMember.count({
        where: { institutionId, role: 'TEACHER', status: 'ACTIVE' },
      }),
      this.prisma.group.count({ where: { institutionId, status: 'ACTIVE' } }),
      this.prisma.assessment.count({ where: { institutionId, status: 'PUBLISHED' } }),
      this.prisma.assessmentAttempt.aggregate({
        where: { assessment: { institutionId }, submittedAt: { not: null } },
        _avg: { accuracy: true },
      }),
    ]);
    return {
      activeStudents,
      activeTeachers,
      groups,
      publishedAssessments: assessments,
      averageAccuracy: avgScore._avg.accuracy,
    };
  }
}