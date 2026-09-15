import { Injectable, NotFoundException } from '@nestjs/common';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';

@Injectable()
export class ParentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
  ) {}

  async listParents(user: RequestUser) {
    const institutionId = this.tenant.requireInstitution(user);
    return this.prisma.parent.findMany({
      where: { institutionId },
      include: {
        studentLinks: { include: { student: { select: { id: true, name: true, grade: true } } } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async linkChild(user: RequestUser, parentId: string, studentId: string) {
    const institutionId = this.tenant.requireInstitution(user);
    const parent = await this.prisma.parent.findFirst({ where: { id: parentId, institutionId } });
    if (!parent) throw new NotFoundException('Parent not found');
    const student = await this.prisma.student.findFirst({ where: { id: studentId, institutionId } });
    if (!student) throw new NotFoundException('Student not found');
    await this.prisma.parentStudentLink.upsert({
      where: { parentId_studentId: { parentId, studentId } },
      create: { parentId, studentId },
      update: {},
    });
    return { ok: true };
  }

  async parentDashboard(user: RequestUser) {
    const parent = await this.prisma.parent.findFirst({
      where: { userId: user.sub },
      include: {
        studentLinks: {
          include: {
            student: {
              include: {
                mastery: { include: { concept: true } },
                attempts: {
                  include: { assessment: true },
                  orderBy: { submittedAt: 'desc' },
                  take: 20,
                },
              },
            },
          },
        },
      },
    });
    if (!parent) {
      return { children: [] };
    }
    return {
      id: parent.id,
      children: parent.studentLinks.map((link) => {
        const s = link.student;
        const overall = s.mastery.length
          ? Math.round(s.mastery.reduce((a, m) => a + m.score, 0) / s.mastery.length)
          : null;
        return {
          studentId: s.id,
          name: s.name,
          grade: s.grade,
          overall,
          weakConcepts: s.mastery.filter((m) => m.level === 'NEEDS_INTERVENTION' || m.level === 'WEAK'),
          strongConcepts: s.mastery.filter((m) => m.level === 'GOOD' || m.level === 'MASTERED'),
          recentTests: s.attempts.map((a) => ({
            assessmentId: a.assessmentId,
            title: a.assessment.title,
            score: a.score,
            maxScore: a.maxScore,
            status: a.status,
            submittedAt: a.submittedAt,
          })),
        };
      }),
    };
  }
}