import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InstitutionType } from '@sanro/types';
import { $Enums } from '@prisma/client';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private requireSuperAdmin(user: RequestUser): void {
    if (user.role !== 'SUPER_ADMIN') throw new ForbiddenException('Super admin access only');
  }

  // ---------- Institutions (tenants) ----------

  async listInstitutions(user: RequestUser, search?: string) {
    this.requireSuperAdmin(user);
    return this.prisma.institution.findMany({
      where: search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }] } : undefined,
      include: {
        _count: { select: { students: true, teachers: true } },
        subscriptions: {
          where: { status: { in: ['ACTIVE', 'TRIAL'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getInstitution(user: RequestUser, id: string) {
    this.requireSuperAdmin(user);
    const institution = await this.prisma.institution.findUnique({
      where: { id },
      include: {
        subscriptions: { orderBy: { createdAt: 'desc' }, take: 5 },
        _count: { select: { students: true, teachers: true, groups: true, questions: true, papers: true, assessments: true } },
      },
    });
    if (!institution) throw new NotFoundException('Institution not found');
    return institution;
  }

  async createInstitution(
    user: RequestUser,
    data: {
      name: string;
      type: InstitutionType;
      code?: string;
      address?: string;
      city?: string;
      state?: string;
      primaryPhone?: string;
      primaryEmail?: string;
      seatLimit?: number;
      adminName: string;
      adminEmail: string;
    },
  ) {
    this.requireSuperAdmin(user);
    return this.prisma.$transaction(async (tx) => {
      const institution = await tx.institution.create({
        data: {
          name: data.name,
          type: data.type as InstitutionType,
          code: data.code ?? data.name.slice(0, 3).toUpperCase(),
          address: data.address ?? null,
          city: data.city ?? null,
          state: data.state ?? null,
          primaryPhone: data.primaryPhone ?? null,
          primaryEmail: data.primaryEmail ?? null,
          seatLimit: data.seatLimit ?? 100,
          status: 'ACTIVE',
        },
      });

      const existing = await tx.institutionMember.findFirst({
        where: { institutionId: institution.id, user: { email: data.adminEmail } },
      });
      if (existing) return { institution, note: 'Admin already linked' };

      const user = await tx.user.findUnique({ where: { email: data.adminEmail } });
      const memberUser =
        user ??
        (await tx.user.create({
          data: {
            name: data.adminName,
            email: data.adminEmail,
            passwordHash: '',
            isSuperAdmin: false,
          },
        }));
      await tx.institutionMember.upsert({
        where: { institutionId_userId: { institutionId: institution.id, userId: memberUser.id } },
        create: { institutionId: institution.id, userId: memberUser.id, role: 'INSTITUTION_ADMIN', status: 'ACTIVE' },
        update: { role: 'INSTITUTION_ADMIN', status: 'ACTIVE' },
      });
      return { institution };
    });
  }

  async updateStatus(user: RequestUser, id: string, status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED') {
    this.requireSuperAdmin(user);
    const institution = await this.prisma.institution.findUnique({ where: { id } });
    if (!institution) throw new NotFoundException('Institution not found');
    await this.prisma.institutionMember.updateMany({
      where: { institutionId: id },
      data: { status: status === 'SUSPENDED' || status === 'ARCHIVED' ? 'DEACTIVATED' : 'ACTIVE' },
    });
    await this.prisma.institution.update({
      where: { id },
      data: { status: status as $Enums.InstitutionStatusEnum },
    });
    return { ok: true, status };
  }

  // ---------- Curriculum management ----------

  async createBoard(user: RequestUser, data: { name: string; code: string }) {
    this.requireSuperAdmin(user);
    return this.prisma.board.create({ data: { name: data.name, code: data.code.toUpperCase() } });
  }

  async createGrade(user: RequestUser, boardId: string, data: { name: string; order?: number }) {
    this.requireSuperAdmin(user);
    const board = await this.prisma.board.findUnique({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');
    return this.prisma.grade.create({ data: { boardId, name: data.name, order: data.order ?? 0 } });
  }

  async createSubject(user: RequestUser, data: { boardId: string; name: string; code: string; color?: string }) {
    this.requireSuperAdmin(user);
    return this.prisma.subject.create({
      data: { boardId: data.boardId, name: data.name, code: data.code, color: data.color ?? null },
    });
  }

  async createChapter(user: RequestUser, data: { subjectId: string; name: string; code: string; grade: string; order?: number }) {
    this.requireSuperAdmin(user);
    const subject = await this.prisma.subject.findUnique({ where: { id: data.subjectId } });
    if (!subject) throw new NotFoundException('Subject not found');
    return this.prisma.chapter.create({
      data: { subjectId: data.subjectId, name: data.name, code: data.code, grade: data.grade, order: data.order ?? 0 },
    });
  }

  async createTopic(user: RequestUser, data: { chapterId: string; name: string; order?: number }) {
    this.requireSuperAdmin(user);
    return this.prisma.topic.create({ data: { chapterId: data.chapterId, name: data.name, order: data.order ?? 0 } });
  }

  async createConcept(user: RequestUser, data: { topicId: string; name: string; order?: number }) {
    this.requireSuperAdmin(user);
    const topic = await this.prisma.topic.findUnique({ where: { id: data.topicId } });
    if (!topic) throw new NotFoundException('Topic not found');
    return this.prisma.concept.create({ data: { topicId: data.topicId, name: data.name, order: data.order ?? 0 } });
  }

  async curriculumTree(user: RequestUser) {
    this.requireSuperAdmin(user);
    const boards = await this.prisma.board.findMany({
      include: {
        grades: true,
        subjects: {
          include: {
            chapters: {
              orderBy: { order: 'asc' },
              include: { topics: { orderBy: { order: 'asc' }, include: { concepts: { orderBy: { order: 'asc' } } } } },
            },
          },
        },
      },
    });
    return boards;
  }

  // ---------- Audit ----------

  async auditLogs(user: RequestUser, page = 1, pageSize = 50) {
    this.requireSuperAdmin(user);
    const [total, rows] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { name: true, email: true } }, institution: { select: { name: true } } },
      }),
    ]);
    return { total, page, pageSize, rows };
  }

  async subscriptions(user: RequestUser) {
    this.requireSuperAdmin(user);
    return this.prisma.subscription.findMany({
      include: { institution: { select: { name: true, code: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async setSubscriptionPlan(user: RequestUser, institutionId: string, data: { planKey: string; status: string; seatLimit?: number }) {
    this.requireSuperAdmin(user);
    const institution = await this.prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) throw new BadRequestException('Institution not found');
    const plan = await this.prisma.plan.findUnique({ where: { key: data.planKey as $Enums.SubscriptionPlanKey } });
    if (!plan) throw new BadRequestException(`Unknown plan "${data.planKey}"`);
    await this.prisma.subscription.updateMany({
      where: { institutionId, status: { in: ['ACTIVE', 'TRIAL'] } },
      data: { status: 'CANCELLED' },
    });
    return this.prisma.subscription.create({
      data: {
        institutionId,
        planId: plan.id,
        status: data.status as $Enums.SubscriptionStatus,
        seatLimit: data.seatLimit ?? institution.seatLimit ?? 100,
        startedAt: new Date(),
        endsAt: new Date(Date.now() + 30 * 86400000),
      },
    });
  }
}