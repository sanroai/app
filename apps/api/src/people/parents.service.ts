import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Role } from '@sanro/types';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';
import { hash } from 'bcryptjs';

@Injectable()
export class ParentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
  ) {}

  async createParent(user: RequestUser, data: { name: string; email: string; phone?: string }) {
    const institutionId = this.tenant.requireInstitution(user);

    const existing = await this.prisma.user.findFirst({ where: { email: data.email } });
    if (existing) throw new ConflictException('A user with this email already exists');

    const password = await hash('sanro123', 10);

    const parent = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          passwordHash: password,
        },
      });
      await tx.institutionMember.create({
        data: { userId: u.id, institutionId, role: 'PARENT' },
      });
      const p = await tx.parent.create({
        data: { userId: u.id, institutionId, name: data.name, email: data.email, phone: data.phone || null },
      });
      return p;
    });

    return parent;
  }

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
    const isSelf = user.role === Role.PARENT;
    if (isSelf) {
      const ownParent = await this.prisma.parent.findFirst({ where: { userId: user.sub, id: parentId } });
      if (!ownParent) throw new ForbiddenException('Parents can only link students to their own account');
    }
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