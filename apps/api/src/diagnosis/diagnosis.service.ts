import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';
import { StudentIdentityService } from '../common/services/student-identity.service';

@Injectable()
export class DiagnosisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
    private readonly identity: StudentIdentityService,
  ) {}

  async myMastery(user: RequestUser) {
    const student = await this.identity.requireForUser(user);
    const mastery = await this.prisma.conceptMastery.findMany({
      where: { studentId: student.id },
      include: { concept: { include: { topic: { include: { chapter: true } } } } },
      orderBy: { score: 'asc' },
    });
    const average = mastery.length
      ? Math.round((mastery.reduce((a, m) => a + m.score, 0) / mastery.length) * 10) / 10
      : 0;
    return { studentId: student.id, averageScore: average, concepts: mastery };
  }

  async studentMastery(user: RequestUser, studentId: string) {
    const institutionId = this.tenant.requireInstitution(user);
    await this.assertCanReadStudent(user, studentId, institutionId);
    const student = await this.prisma.student.findFirst({ where: { id: studentId, institutionId } });
    if (!student) throw new NotFoundException('Student not found');
    const mastery = await this.prisma.conceptMastery.findMany({
      where: { studentId },
      include: { concept: { include: { topic: true } } },
      orderBy: { score: 'asc' },
    });
    const history = await this.prisma.diagnosticResult.findMany({
      where: { studentId },
      include: { concept: true, attempt: { select: { submittedAt: true } } },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
    return { student, mastery, history, weaknessCount: mastery.filter((m) => m.level === 'WEAK' || m.level === 'NEEDS_INTERVENTION').length };
  }

  /**
   * Authorises a single-student diagnosis read.
   *
   * Staff (INSTITUTION_ADMIN / TEACHER) may read any student in their own
   * institution. A STUDENT may read only their own record; a PARENT only the
   * children explicitly linked to them. Anything else is a 403 — a student
   * must not be able to pull a classmate's PII (email, phone, DOB, roll no).
   */
  private async assertCanReadStudent(user: RequestUser, studentId: string, institutionId: string) {
    if (user.role === 'INSTITUTION_ADMIN' || user.role === 'TEACHER') return;

    if (user.role === 'STUDENT') {
      const me = await this.identity.resolveForUser(user);
      if (me && me.id === studentId) return;
      throw new ForbiddenException('Students may only view their own diagnosis');
    }

    if (user.role === 'PARENT') {
      const parent = await this.prisma.parent.findFirst({ where: { userId: user.sub, institutionId } });
      if (!parent) throw new ForbiddenException('No parent profile for this account');
      const link = await this.prisma.parentStudentLink.findFirst({
        where: { parentId: parent.id, studentId },
      });
      if (link) return;
      throw new ForbiddenException('Parents may only view their linked children');
    }

    // SUPER_ADMIN has no institution binding and is rejected by requireInstitution.
    throw new ForbiddenException('No access to this student');
  }

  async conceptDistribution(user: RequestUser, conceptId: string) {
    const institutionId = this.tenant.requireInstitution(user);
    const concept = await this.prisma.concept.findUnique({ where: { id: conceptId } });
    if (!concept) throw new NotFoundException('Concept not found');
    const rows = await this.prisma.conceptMastery.groupBy({
      by: ['level'],
      where: { conceptId, student: { institutionId } },
      _count: true,
      _avg: { score: true },
    });
    return { concept, distribution: rows.map((r) => ({ level: r.level, count: r._count, avgScore: Math.round((r._avg.score ?? 0) * 10) / 10 })) };
  }
}