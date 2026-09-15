import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';
import { AuditService, NotificationsService } from '../common/services/audit-notifications.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class TeachersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  private assertAllowed(user: RequestUser): void {
    if (user.role !== 'INSTITUTION_ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only institution admins can manage teachers');
    }
  }

  async listTeachers(user: RequestUser) {
    const institutionId = this.tenant.requireInstitution(user);
    return this.prisma.teacher.findMany({
      where: { institutionId },
      include: {
        user: { select: { email: true, name: true, isActive: true } },
        subjects: { include: { subject: true } },
        groups: { include: { group: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTeacher(
    user: RequestUser,
    data: { name: string; email: string; phone?: string; employeeId?: string; subjectIds?: string[]; groupIds?: string[] },
  ) {
    const institutionId = this.tenant.requireInstitution(user);
    this.assertAllowed(user);

    const email = data.email.toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (!existingUser) {
      const password = `T@${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
      const account = await this.prisma.user.create({
        data: {
          email,
          name: data.name,
          phone: data.phone ?? null,
          passwordHash: await bcrypt.hash(password, 10),
        },
      });
      await this.prisma.institutionMember.create({
        data: { institutionId, userId: account.id, role: 'TEACHER', status: 'ACTIVE' },
      });
      await this.notifications.create({
        recipientUserId: account.id,
        type: 'ACHIEVEMENT_UNLOCKED',
        title: 'Welcome to Sanro AI',
        body: `Your teacher account is ready, ${data.name}. Sign in with ${email}.`,
      });
      return this.finalize(user, account.id, data, email);
    }

    const member = await this.prisma.institutionMember.findUnique({
      where: { institutionId_userId: { institutionId, userId: existingUser.id } },
    });
    if (member && member.role === 'TEACHER') {
      throw new ConflictException('This teacher already belongs to the institution');
    }

    const account = existingUser;
    return this.finalize(user, account.id, data, email);
  }

  private async finalize(
    actor: RequestUser,
    userId: string,
    data: { name: string; employeeId?: string; subjectIds?: string[]; groupIds?: string[] },
    email: string,
  ) {
    const institutionId = this.tenant.requireInstitution(actor);
    const groupMap = new Map<string, string>();
    if (data.groupIds?.length) {
      const groups = await this.prisma.group.findMany({
        where: { id: { in: data.groupIds } },
        select: { id: true, academicYearId: true },
      });
      for (const g of groups) groupMap.set(g.id, g.academicYearId);
    }
    const teacher = await this.prisma.teacher.create({
      data: {
        institutionId,
        userId,
        employeeId: data.employeeId ?? null,
        status: 'ACTIVE',
        subjects: {
          create: (data.subjectIds ?? []).map((s) => ({ subjectId: s })),
        },
        groups: {
          create: (data.groupIds ?? []).map((g) => ({
            groupId: g,
            academicYearId: groupMap.get(g) ?? '',
          })),
        },
      },
      include: { user: true, subjects: true, groups: true },
    });

    await this.audit.log({
      userId: actor.sub,
      institutionId,
      action: 'TEACHER_ADDED',
      entityType: 'Teacher',
      entityId: teacher.id,
      metadata: { email },
    });
    return teacher;
  }

  async setStatus(user: RequestUser, id: string, status: 'ACTIVE' | 'DEACTIVATED') {
    const institutionId = this.tenant.requireInstitution(user);
    this.assertAllowed(user);
    const teacher = await this.prisma.teacher.findFirst({ where: { id, institutionId } });
    if (!teacher) throw new NotFoundException('Teacher not found');
    await this.prisma.teacher.update({
      where: { id },
      data: { status: status as 'ACTIVE' | 'DEACTIVATED', deactivatedAt: status === 'DEACTIVATED' ? new Date() : null },
    });
    await this.prisma.user.update({
      where: { id: teacher.userId },
      data: { isActive: status === 'ACTIVE' },
    });
    return { ok: true };
  }

  async assignGroups(user: RequestUser, id: string, groupIds: string[]) {
    const institutionId = this.tenant.requireInstitution(user);
    this.assertAllowed(user);
    const teacher = await this.prisma.teacher.findFirst({ where: { id, institutionId } });
    if (!teacher) throw new NotFoundException('Teacher not found');
    await this.prisma.teacherGroup.deleteMany({ where: { teacherId: id } });
    const groups = await this.prisma.group.findMany({ where: { id: { in: groupIds }, institutionId } });
    for (const g of groups) {
      await this.prisma.teacherGroup.create({
        data: { teacherId: id, groupId: g.id, academicYearId: g.academicYearId },
      });
    }
    return { ok: true };
  }
}