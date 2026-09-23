import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantAccessService } from '../common/security/tenant-access.service';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AcademicsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
  ) {}

  private assertAdmin(user: RequestUser): void {
    if (user.role !== 'INSTITUTION_ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only institution admins can modify academic structure');
    }
  }

  // ---- Academic years ------------------------------------------------------

  async listAcademicYears(user: RequestUser) {
    const institutionId = this.tenant.assertInstitutionAccess(user);
    return this.prisma.academicYear.findMany({
      where: institutionId ? { institutionId } : {},
      orderBy: { startDate: 'desc' },
    });
  }

  async createAcademicYear(
    user: RequestUser,
    data: { name: string; startDate: string; endDate: string },
  ) {
    const institutionId = this.tenant.requireInstitution(user);
    this.assertAdmin(user);
    return this.prisma.academicYear.create({
      data: {
        institutionId,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: 'PREPARING',
      },
    });
  }

  async activateAcademicYear(user: RequestUser, id: string) {
    const institutionId = this.tenant.requireInstitution(user);
    this.assertAdmin(user);
    const year = await this.prisma.academicYear.findFirst({ where: { id, institutionId } });
    if (!year) throw new NotFoundException('Academic year not found');
    await this.prisma.$transaction([
      this.prisma.academicYear.updateMany({
        where: { institutionId },
        data: { status: 'COMPLETED' },
      }),
      this.prisma.academicYear.update({ where: { id }, data: { status: 'ACTIVE' } }),
    ]);
    return { ok: true };
  }

  // ---- Groups --------------------------------------------------------------

  async listGroups(user: RequestUser, yearId?: string) {
    const institutionId = this.tenant.assertInstitutionAccess(user);
    const institutionFilter = institutionId ? { institutionId } : {};

    if (user.role === 'TEACHER') {
      const teacherGroups = await this.prisma.teacherGroup.findMany({
        where: { teacher: { userId: user.sub }, academicYear: institutionFilter },
        select: { groupId: true },
      });
      const allowed = new Set(teacherGroups.map((t) => t.groupId));
      return this.prisma.group.findMany({
        where: {
          ...institutionFilter,
          status: 'ACTIVE',
          ...(yearId ? { academicYearId: yearId } : {}),
          ...(allowed.size ? { id: { in: [...allowed] } } : { id: '00000000-0000-0000-0000-000000000000' }),
        },
        orderBy: [{ grade: 'asc' }, { name: 'asc' }],
        include: { _count: { select: { memberships: true } } },
      });
    }

    return this.prisma.group.findMany({
      where: { ...institutionFilter, ...(yearId ? { academicYearId: yearId } : {}) },
      orderBy: [{ grade: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { memberships: true } } },
    });
  }

  async createGroup(
    user: RequestUser,
    data: {
      academicYearId: string;
      name: string;
      type: 'CLASS' | 'DIVISION' | 'BATCH';
      grade?: string;
      parentGroupId?: string;
    },
  ) {
    const institutionId = this.tenant.requireInstitution(user);
    this.assertAdmin(user);
    const year = await this.prisma.academicYear.findFirst({
      where: { id: data.academicYearId, institutionId },
    });
    if (!year) throw new NotFoundException('Academic year not found');
    return this.prisma.group.create({
      data: {
        institutionId,
        academicYearId: data.academicYearId,
        name: data.name,
        type: data.type,
        grade: data.grade,
        parentGroupId: data.parentGroupId,
        status: 'ACTIVE',
      },
    });
  }

  async updateGroup(
    user: RequestUser,
    id: string,
    data: { name?: string; grade?: string; status?: 'ACTIVE' | 'ARCHIVED' },
  ) {
    const institutionId = this.tenant.requireInstitution(user);
    this.assertAdmin(user);
    const group = await this.prisma.group.findFirst({ where: { id, institutionId } });
    if (!group) throw new NotFoundException('Group not found');
    if (data.status === 'ARCHIVED') {
      await this.prisma.group.update({ where: { id }, data: { status: 'ARCHIVED', archivedAt: new Date() } });
      return { ok: true };
    }
    await this.prisma.group.update({ where: { id }, data });
    return { ok: true };
  }

  async groupDetail(user: RequestUser, id: string) {
    const institutionId = this.tenant.requireInstitution(user);
    const group = await this.prisma.group.findFirst({
      where: { id, institutionId },
      include: {
        academicYear: true,
        memberships: {
          where: { leftAt: null },
          include: {
            student: { include: { mastery: true } },
          },
          orderBy: { student: { rollNumber: 'asc' } },
        },
      },
    });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }
}