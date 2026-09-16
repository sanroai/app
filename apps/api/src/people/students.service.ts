import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';
import { AuditService, NotificationsService } from '../common/services/audit-notifications.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

interface CreateStudentData {
  academicYearId: string;
  name: string;
  email?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  rollNumber?: string;
  grade?: string;
  groupIds?: string[];
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
}

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async listStudents(user: RequestUser, query: {
    academicYearId?: string;
    groupId?: string;
    search?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) {
    const institutionId = this.tenant.requireInstitution(user);

    const baseWhere: Prisma.StudentWhereInput = {
      institutionId,
      ...(query.academicYearId ? { academicYearId: query.academicYearId } : {}),
      ...(query.status ? { status: query.status as 'ACTIVE' | 'DEACTIVATED' } : {}),
    };

    if (query.search) {
      baseWhere.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
        { rollNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.groupId) {
      const group = await this.prisma.group.findFirst({
        where: { id: query.groupId, institutionId },
      });
      if (!group) throw new NotFoundException('Group not found');
      baseWhere.groupMemberships = { some: { groupId: query.groupId, leftAt: null } };
    }

    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 25, 200);

    // Teachers may only see students in groups they are assigned to.
    if (user.role === 'TEACHER') {
      const teacherGroups = await this.prisma.teacherGroup.findMany({
        where: { teacher: { userId: user.sub } },
        select: { groupId: true },
      });
      if (teacherGroups.length === 0) {
        return { data: [], total: 0, page, pageSize, pages: 0 };
      }
      baseWhere.groupMemberships = {
        some: {
          leftAt: null,
          ...(query.groupId ? { groupId: query.groupId } : {}),
          groupId: { in: teacherGroups.map((t) => t.groupId) },
        },
      };
    }

    const [total, rows] = await Promise.all([
      this.prisma.student.count({ where: baseWhere }),
      this.prisma.student.findMany({
        where: baseWhere,
        orderBy: [{ grade: 'asc' }, { rollNumber: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          groupMemberships: {
            where: { leftAt: null },
            include: { group: true },
          },
          mastery: true,
          academicYear: true,
          parentLinks: { include: { parent: true } },
        },
      }),
    ]);

    return {
      students: rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        gender: r.gender,
        rollNumber: r.rollNumber,
        grade: r.grade,
        status: r.status,
        academicYearId: r.academicYearId,
        group: r.groupMemberships.length > 0 ? {
          id: r.groupMemberships[0].group.id,
          name: r.groupMemberships[0].group.name,
          type: r.groupMemberships[0].group.type,
        } : null,
        groups: r.groupMemberships.map((m) => ({
          id: m.group.id,
          name: m.group.name,
          type: m.group.type,
        })),
        mastery: r.mastery.map((m) => m.level),
        parents: r.parentLinks.map((pl) => ({
          id: pl.parent.id,
          name: pl.parent.name,
          phone: pl.parent.phone,
          email: pl.parent.email,
        })),
      })),
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  async createStudent(user: RequestUser, data: CreateStudentData) {
    const institutionId = this.tenant.requireInstitution(user);
    if (user.role === 'TEACHER') throw new ForbiddenException('Teachers cannot create students');

    await this.enforceSeatLimit(institutionId, 1);

    if (data.email && data.email.trim()) {
      const existing = await this.prisma.student.findFirst({
        where: { institutionId, email: data.email.trim().toLowerCase() },
      });
      if (existing) throw new ConflictException('A student with this email already exists');
    }

    let userAccountId: string | null = null;
    if (data.email && data.email.trim()) {
      const email = data.email.trim().toLowerCase();
      const existingUser = await this.prisma.user.findUnique({ where: { email } });
      const password = this.randomPassword();
      const account = existingUser
        ? existingUser
        : await this.prisma.user.create({
            data: {
              email,
              name: data.name,
              phone: data.phone ?? null,
              passwordHash: await bcrypt.hash(password, 10),
            },
          });
      userAccountId = account.id;
      if (!existingUser) {
        await this.prisma.institutionMember.create({
          data: { institutionId, userId: account.id, role: 'STUDENT', status: 'ACTIVE' },
        });
        await this.notifications.create({
          recipientUserId: account.id,
          type: 'ACHIEVEMENT_UNLOCKED',
          title: 'Welcome to Sanro AI',
          body: `Your account is ready, ${data.name}. Sign in with ${email}.`,
        });
      } else {
        // Reused an existing account (possibly a user in another institution).
        // Ensure a STUDENT membership exists here so the account can log in as a
        // student in THIS institution without clobbering other role memberships.
        await this.prisma.institutionMember.upsert({
          where: { institutionId_userId: { institutionId, userId: account.id } },
          create: { institutionId, userId: account.id, role: 'STUDENT', status: 'ACTIVE' },
          update: {},
        });
        await this.notifications.create({
          recipientUserId: account.id,
          type: 'ACHIEVEMENT_UNLOCKED',
          title: 'Welcome to Sanro AI',
          body: `Your account is ready, ${data.name}. Sign in with ${email}.`,
        });
      }
    }

    const student = await this.prisma.student.create({
      data: {
        institutionId,
        academicYearId: data.academicYearId,
        userId: userAccountId,
        name: data.name,
        email: data.email?.trim().toLowerCase() ?? null,
        phone: data.phone ?? null,
        gender: data.gender ?? null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        rollNumber: data.rollNumber ?? null,
        grade: data.grade ?? null,
        status: 'ACTIVE',
      },
    });

    for (const gid of data.groupIds ?? []) {
      await this.addToGroup(institutionId, data.academicYearId, student.id, gid);
    }

    if (data.parentName || data.parentEmail || data.parentPhone) {
      await this.linkParent(institutionId, student.id, {
        name: data.parentName ?? 'Parent',
        email: data.parentEmail,
        phone: data.parentPhone,
      });
    }

    await this.audit.log({
      userId: user.sub,
      institutionId,
      action: 'STUDENT_CREATED',
      entityType: 'Student',
      entityId: student.id,
      metadata: { name: data.name },
    });

    return this.studentDetail(user, student.id);
  }

  private randomPassword(): string {
    return `S@${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
  }

  async addToGroup(institutionId: string, academicYearId: string, studentId: string, groupId: string) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, institutionId, academicYearId },
    });
    if (!group) throw new BadRequestException(`Group ${groupId} does not exist in this academic year`);
    await this.prisma.groupMembership.upsert({
      where: {
        groupId_studentId_academicYearId: { groupId, studentId, academicYearId },
      },
      create: { groupId, studentId, academicYearId },
      update: { leftAt: null },
    });
  }

  async linkParent(
    institutionId: string,
    studentId: string,
    parentData: { name: string; email?: string; phone?: string },
  ) {
    const student = await this.prisma.student.findFirst({ where: { id: studentId, institutionId } });
    if (!student) throw new NotFoundException('Student not found');

    let parent = parentData.email
      ? await this.prisma.parent.findFirst({ where: { institutionId, email: parentData.email.toLowerCase() } })
      : null;
    if (!parent && parentData.phone) {
      parent = await this.prisma.parent.findFirst({ where: { institutionId, phone: parentData.phone } });
    }

    if (!parent) {
      parent = await this.prisma.parent.create({
        data: {
          institutionId,
          name: parentData.name,
          email: parentData.email?.trim().toLowerCase() ?? null,
          phone: parentData.phone ?? null,
        },
      });
    }
    await this.prisma.parentStudentLink.upsert({
      where: { parentId_studentId: { parentId: parent.id, studentId } },
      create: { parentId: parent.id, studentId },
      update: {},
    });
    return parent;
  }

  async updateStudent(user: RequestUser, id: string, data: Partial<CreateStudentData>) {
    const institutionId = this.tenant.requireInstitution(user);
    const student = await this.prisma.student.findFirst({ where: { id, institutionId } });
    if (!student) throw new NotFoundException('Student not found');

    if (data.groupIds) {
      const current = await this.prisma.groupMembership.findMany({
        where: { studentId: id, leftAt: null },
      });
      for (const m of current) {
        if (!data.groupIds.includes(m.groupId)) {
          await this.prisma.groupMembership.update({
            where: { groupId_studentId_academicYearId: { groupId: m.groupId, studentId: id, academicYearId: m.academicYearId } },
            data: { leftAt: new Date() },
          });
        }
      }
      for (const gid of data.groupIds) {
        await this.addToGroup(institutionId, student.academicYearId, id, gid);
      }
    }

    const updated = await this.prisma.student.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email ? data.email.trim().toLowerCase() : undefined,
        phone: data.phone,
        gender: data.gender,
        rollNumber: data.rollNumber,
        grade: data.grade,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      },
    });
    return updated;
  }

  async setStatus(user: RequestUser, id: string, status: 'ACTIVE' | 'DEACTIVATED') {
    const institutionId = this.tenant.requireInstitution(user);
    const student = await this.prisma.student.findFirst({ where: { id, institutionId } });
    if (!student) throw new NotFoundException('Student not found');
    await this.prisma.student.update({
      where: { id },
      data: { status, deactivatedAt: status === 'DEACTIVATED' ? new Date() : null },
    });
    if (student.userId) {
      await this.prisma.user.update({ where: { id: student.userId }, data: { isActive: status === 'ACTIVE' } });
    }
    return { ok: true };
  }

  async moveStudent(
    user: RequestUser,
    id: string,
    data: { fromGroupId?: string; toGroupIds: string[]; academicYearId: string },
  ) {
    const institutionId = this.tenant.requireInstitution(user);
    const student = await this.prisma.student.findFirst({ where: { id, institutionId } });
    if (!student) throw new NotFoundException('Student not found');

    if (data.fromGroupId) {
      await this.prisma.groupMembership.updateMany({
        where: { studentId: id, groupId: data.fromGroupId, leftAt: null },
        data: { leftAt: new Date() },
      });
    }
    for (const gid of data.toGroupIds) {
      await this.addToGroup(institutionId, data.academicYearId, id, gid);
    }
    if (student.academicYearId !== data.academicYearId && data.academicYearId) {
      await this.prisma.student.update({
        where: { id },
        data: { academicYearId: data.academicYearId },
      });
    }
    await this.audit.log({
      userId: user.sub,
      institutionId,
      action: 'STUDENT_MOVED',
      entityType: 'Student',
      entityId: id,
      metadata: data,
    });
    return { ok: true };
  }

  async studentDetail(user: RequestUser, id: string) {
    const institutionId = this.tenant.requireInstitution(user);
    const student = await this.prisma.student.findFirst({
      where: { id, institutionId },
      include: {
        academicYear: true,
        groupMemberships: { where: { leftAt: null }, include: { group: true } },
        parentLinks: { include: { parent: true } },
        mastery: { include: { concept: { include: { topic: true } } } },
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async enforceSeatLimit(institutionId: string, additional: number): Promise<void> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { institutionId, status: { in: ['ACTIVE', 'TRIAL'] } },
      orderBy: { createdAt: 'desc' },
    });
    const limit = subscription?.seatLimit ?? (await this.prisma.institution.findUnique({ where: { id: institutionId } }))?.seatLimit;
    if (limit == null) return;
    const count = await this.prisma.student.count({ where: { institutionId, status: 'ACTIVE' } });
    if (count + additional > limit) {
      throw new BadRequestException({
        code: 'SEAT_LIMIT_REACHED',
        message: 'Student seat limit reached. Please upgrade your subscription.',
      });
    }
  }
}