import { Injectable, NotFoundException } from '@nestjs/common';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';

@Injectable()
export class DiagnosisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
  ) {}

  async myMastery(user: RequestUser) {
    const student = await this.prisma.student.findUnique({ where: { userId: user.sub } });
    if (!student) throw new NotFoundException('Student profile not found');
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