import { Injectable, BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuditAction, Role } from '@sanro/types';
import { Prisma } from '@prisma/client';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit-notifications.service';
import { EntitlementService } from '../common/security/entitlement.service';
import { SubscriptionAccessService } from '../common/security/subscription-access.service';
import { SystemInstitutionService } from '../common/security/system-institution.service';
import { StudentGradeAccessService } from '../common/services/student-grade-access.service';

export interface PeopleListQuery {
  institutionId?: string;
  search?: string;
  grade?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  source?: 'INSTITUTION' | 'DIRECT_SANRO';
  subscriptionStatus?: string;
}

export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

const SUB_STATUSES = ['ACTIVE', 'TRIAL', 'EXPIRED', 'CANCELLED', 'PAST_DUE', 'SUSPENDED'] as const;
const EXPIRING_SOON_DAYS = 30;

@Injectable()
export class AdminPeopleService {
  private _systemId: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly entitlement: EntitlementService,
    private readonly subscriptionAccess: SubscriptionAccessService,
    private readonly systemInstitution: SystemInstitutionService,
    private readonly gradeAccess: StudentGradeAccessService,
  ) {}

  private async systemId(): Promise<string> {
    if (!this._systemId) this._systemId = await this.systemInstitution.systemInstitutionId();
    return this._systemId;
  }

  private assertSuperAdmin(user: RequestUser): void {
    if (user.role !== Role.SUPER_ADMIN) throw new ForbiddenException('Super admin required');
  }

  private async auditLog(user: RequestUser, action: AuditAction, entityType: string, entityId: string | null, metadata?: Record<string, unknown>, institutionId?: string | null): Promise<void> {
    await this.audit.log({
      userId: user.sub,
      institutionId: institutionId ?? null,
      action,
      entityType,
      entityId,
      metadata: metadata ?? {},
    });
  }

  private async clearInstitutionEntitlements(institutionId: string): Promise<void> {
    await this.subscriptionAccess.invalidate(institutionId);
    this.entitlement.clearCache();
  }

  private paginate(q: { page?: number; pageSize?: number }): { page: number; pageSize: number; skip: number; take: number } {
    const page = Math.max(1, q.page ?? 1);
    const pageSize = Math.min(Math.max(1, q.pageSize ?? 20), 100);
    return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
  }

  private mapDirectSubscription(sub: any): any {
    if (!sub) return null;
    return {
      id: sub.id,
      planKey: sub.plan?.key ?? null,
      planName: sub.plan?.name ?? null,
      status: sub.status ?? null,
      startedAt: sub.startedAt ?? null,
      endsAt: sub.endsAt ?? null,
    };
  }

  private deriveSubscriptionStatus(sub: any): string {
    if (!sub) return 'NONE';
    const status: string = sub.status ?? 'NONE';
    if (sub.endsAt) {
      const days = Math.ceil((new Date(sub.endsAt).getTime() - Date.now()) / 86400000);
      if (days < 0) return 'EXPIRED';
      if (days <= EXPIRING_SOON_DAYS && (status === 'ACTIVE' || status === 'TRIAL')) return 'EXPIRING_SOON';
    }
    return status;
  }

  private mapAuditRows(rows: any[]): any[] {
    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      metadata: (r.metadata ?? {}) as unknown as Record<string, unknown>,
      createdAt: r.createdAt,
      user: r.user ? { name: r.user.name, email: r.user.email } : null,
    }));
  }

  private async mapStudentListItem(row: any): Promise<any> {
    const user: any = row.user ?? null;
    const directSubs: any[] = user?.subscriptions ?? [];
    const directSub = directSubs[0] ?? null;
    const sId = await this.systemId();
    const isDirect = !row.institutionId || row.institutionId === sId;
    return {
      id: row.id,
      userId: user?.id ?? null,
      name: row.name,
      email: row.email ?? null,
      phone: row.phone ?? null,
      rollNumber: row.rollNumber ?? null,
      grade: row.grade ?? null,
      gender: row.gender ?? null,
      dateOfBirth: row.dateOfBirth ?? null,
      status: row.status ?? null,
      isActive: user?.isActive ?? null,
      source: isDirect ? 'DIRECT_SANRO' : 'INSTITUTION',
      institutionId: row.institutionId ?? sId,
      institutionName: isDirect ? 'SANRO AI' : (row.institution?.name ?? null),
      academicYearId: row.academicYearId ?? null,
      subscriptionStatus: this.deriveSubscriptionStatus(directSub),
      subscription: this.mapDirectSubscription(directSub),
      createdAt: row.createdAt,
    };
  }

  private mapTeacherListItem(row: any): any {
    const user: any = row.user ?? null;
    return {
      id: row.id,
      userId: user?.id ?? null,
      name: user?.name ?? null,
      email: user?.email ?? null,
      phone: user?.phone ?? null,
      employeeId: row.employeeId ?? null,
      status: row.status ?? null,
      isActive: user?.isActive ?? null,
      institutionId: row.institutionId ?? null,
      institutionName: row.institution?.name ?? null,
      subjects: (row.subjects ?? []).map((ts: any) => ({ id: ts.subject?.id, name: ts.subject?.name })),
      groups: (row.groups ?? []).map((tg: any) => ({ id: tg.group?.id, name: tg.group?.name })),
      createdAt: row.createdAt,
    };
  }

  private async mapLinkedChild(student: any): Promise<any> {
    const sId = await this.systemId();
    const isDirect = !student.institutionId || student.institutionId === sId;
    return {
      studentId: student.id,
      studentName: student.name,
      grade: student.grade ?? null,
      institutionId: student.institutionId ?? sId,
      institutionName: isDirect ? 'SANRO AI' : (student.institution?.name ?? null),
      source: isDirect ? 'DIRECT_SANRO' : 'INSTITUTION',
      status: student.status ?? null,
    };
  }

  private async mapParentListItem(row: any): Promise<any> {
    const user: any = row.user ?? null;
    const isActive = user?.isActive !== false;
    const children = await Promise.all((row.studentLinks ?? []).map((link: any) => this.mapLinkedChild(link.student)));
    const sId = await this.systemId();
    const isDirect = !row.institutionId || row.institutionId === sId;
    return {
      id: row.id,
      userId: user?.id ?? null,
      name: row.name,
      email: row.email ?? null,
      phone: row.phone ?? null,
      status: isActive ? 'ACTIVE' : 'DEACTIVATED',
      isActive,
      source: isDirect ? 'DIRECT_SANRO' : 'INSTITUTION',
      institutionId: row.institutionId ?? sId,
      institutionName: isDirect ? 'SANRO AI' : (row.institution?.name ?? null),
      childrenCount: children.length,
      children,
      createdAt: row.createdAt,
    };
  }

  /* ============================= STUDENTS ============================= */

  async listStudents(user: RequestUser, q: PeopleListQuery): Promise<ListResult<any>> {
    this.assertSuperAdmin(user);
    const { page, pageSize, skip, take } = this.paginate(q);
    const where: Prisma.StudentWhereInput = {};
    const and: Prisma.StudentWhereInput[] = [];
    if (q.institutionId) {
      where.institutionId = q.institutionId;
    } else if (q.source === 'DIRECT_SANRO') {
      const sId = await this.systemId();
      and.push({ OR: [{ institutionId: sId }, { institutionId: null }] });
    } else if (q.source === 'INSTITUTION') {
      const sId = await this.systemId();
      where.institutionId = { notIn: [sId] };
    }
    if (q.grade) where.grade = q.grade;
    if (q.status) where.status = q.status as 'ACTIVE' | 'DEACTIVATED' | 'ARCHIVED';
    if (q.search) {
      const term = q.search.trim();
      if (term) {
        and.push({
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
            { phone: { contains: term, mode: 'insensitive' } },
            { user: { name: { contains: term, mode: 'insensitive' } } },
          ],
        });
      }
    }
    if (q.subscriptionStatus) {
      const ss = q.subscriptionStatus;
      if (ss === 'NONE') {
        and.push({ OR: [{ userId: null }, { user: { subscriptions: { none: {} } } }] });
      } else if (ss === 'EXPIRING_SOON') {
        const from = new Date();
        const to = new Date(from.getTime() + EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000);
        where.user = {
          subscriptions: {
            some: { status: { in: ['ACTIVE', 'TRIAL'] }, endsAt: { gte: from, lte: to } },
          },
        };
      } else {
        where.user = {
          subscriptions: { some: { status: ss as (typeof SUB_STATUSES)[number] } },
        };
      }
    }
    if (and.length) where.AND = and;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isActive: true,
              createdAt: true,
              subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' } },
            },
          },
          institution: { select: { id: true, name: true, type: true, status: true } },
          academicYear: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.student.count({ where }),
    ]);
    return { items: await Promise.all(items.map((row) => this.mapStudentListItem(row))), total, page, pageSize };
  }
async listStudentsByInstitution(user: RequestUser, institutionId: string, q: Omit<PeopleListQuery, 'institutionId'>): Promise<ListResult<any>> {
    this.assertSuperAdmin(user);
    return this.listStudents(user, { ...q, institutionId });
  }

  async studentDetail(user: RequestUser, id: string): Promise<any> {
    this.assertSuperAdmin(user);
    const student: any = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
            subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' } },
          },
        },
        institution: { select: { id: true, name: true, type: true, status: true } },
        academicYear: { select: { id: true, name: true } },
        groupMemberships: { include: { group: { select: { id: true, name: true, type: true, status: true } } } },
        parentLinks: {
          include: {
            parent: {
              include: {
                user: { select: { id: true, name: true, isActive: true } },
                institution: { select: { id: true, name: true } },
                studentLinks: { select: { studentId: true } },
              },
            },
          },
        },
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    const [attemptsCount, recentAudit] = await Promise.all([
      this.prisma.assessmentAttempt.count({ where: { studentId: id } }),
      this.prisma.auditLog.findMany({
        where: { entityType: 'STUDENT', entityId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);
    const relatedUser: any = student.user ?? null;
    const directSubs: any[] = relatedUser?.subscriptions ?? [];
    const parents = await Promise.all(
      (student.parentLinks ?? []).map(async (pl: any) => {
        const p = pl.parent;
        const pActive = p.user?.isActive !== false;
        const sId = await this.systemId();
        const isDirect = !p.institutionId || p.institutionId === sId;
        return {
          id: p.id,
          userId: p.userId ?? null,
          name: p.name,
          email: p.email ?? null,
          phone: p.phone ?? null,
          source: isDirect ? 'DIRECT_SANRO' : 'INSTITUTION',
          institutionId: p.institutionId ?? sId,
          institutionName: isDirect ? 'SANRO AI' : (p.institution?.name ?? null),
          childrenCount: p.studentLinks?.length ?? 0,
          status: pActive ? 'ACTIVE' : 'DEACTIVATED',
          isActive: pActive,
        };
      }),
    );
    return {
      ...(await this.mapStudentListItem(student)),
      user: relatedUser ? { id: relatedUser.id, name: relatedUser.name, email: relatedUser.email, phone: relatedUser.phone ?? null, isActive: relatedUser.isActive, createdAt: relatedUser.createdAt } : null,
      institution: student.institution ? { ...student.institution } : null,
      academicYear: student.academicYear ? { id: student.academicYear.id, name: student.academicYear.name } : null,
      groups: (student.groupMemberships ?? []).map((gm: any) => gm.group),
      parents,
      directSubscription: this.mapDirectSubscription(directSubs[0] ?? null),
      subscriptions: directSubs.map((s: any) => this.mapDirectSubscription(s)),
      assessmentAttemptsCount: attemptsCount,
      recentAudit: this.mapAuditRows(recentAudit),
    };
  }

  async createStudent(user: RequestUser, data: any): Promise<any> {
    this.assertSuperAdmin(user);
    const email = data.email?.toLowerCase?.() ?? null;
    const sId = await this.systemId();
    let instId = sId;
    if (data.institutionId) {
      if (data.institutionId === sId) {
        throw new ConflictException('The SANRO AI system institution cannot be used as a tenant institution for a student');
      }
      const inst = await this.prisma.institution.findUnique({ where: { id: data.institutionId }, select: { id: true } });
      if (!inst) throw new BadRequestException('Institution not found');
      instId = data.institutionId;
    }
    if (data.academicYearId) {
      const ay = await this.prisma.academicYear.findUnique({ where: { id: data.academicYearId }, select: { id: true } });
      if (!ay) throw new BadRequestException('Academic year not found');
    }
    const pwd = this.randomPassword();
    const created = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const dbUser = await tx.user.create({
        data: {
          name: data.name,
          email,
          phone: data.phone ?? null,
          passwordHash: await bcrypt.hash(pwd, 10),
          isActive: true,
        },
      });
      const student = await tx.student.create({
        data: {
          institutionId: instId,
          academicYearId: data.academicYearId ?? null,
          userId: dbUser.id,
          name: data.name,
          email,
          phone: data.phone ?? null,
          gender: data.gender ?? null,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          rollNumber: data.rollNumber ?? null,
          grade: data.grade ?? null,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: user.sub,
          institutionId: instId,
          action: AuditAction.STUDENT_CREATED,
          entityType: 'STUDENT',
          entityId: student.id,
          metadata: { email } as Prisma.InputJsonValue,
        },
      });
      return student;
    });
    await this.clearInstitutionEntitlements(instId);
    await this.gradeAccess.setEnrolments(
      created.id,
      data.grades?.length ? data.grades : data.grade ? [data.grade] : [],
    );
    const isDirectCreate = instId === sId;
    const createdInst = isDirectCreate
      ? { name: 'SANRO AI' }
      : await this.prisma.institution.findUnique({ where: { id: instId }, select: { name: true } });
    return {
      id: created.id,
      defaultPassword: pwd,
      institutionId: instId,
      institutionName: createdInst?.name ?? null,
      source: isDirectCreate ? 'DIRECT_SANRO' : 'INSTITUTION',
    };
  }

  async updateStudent(user: RequestUser, id: string, data: any): Promise<any> {
    this.assertSuperAdmin(user);
    const existing = await this.prisma.student.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Student not found');
    const updated = await this.prisma.student.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        gender: data.gender,
        rollNumber: data.rollNumber,
        grade: data.grade,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (data.grades) {
      await this.gradeAccess.setEnrolments(id, data.grades);
    } else if (data.grade) {
      await this.gradeAccess.addEnrolment(id, data.grade);
    }
    await this.auditLog(user, AuditAction.STUDENT_UPDATED, 'STUDENT', id, { studentId: id });
    return updated;
  }

  async transferStudent(user: RequestUser, id: string, targetInstitutionId: string): Promise<any> {
    this.assertSuperAdmin(user);
    const target = await this.prisma.institution.findUnique({ where: { id: targetInstitutionId }, select: { id: true } });
    if (!target) throw new BadRequestException('Target institution not found');
    const existing = await this.prisma.student.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Student not found');
    const updated = await this.prisma.student.update({
      where: { id },
      data: { institutionId: targetInstitutionId },
    });
    await this.clearInstitutionEntitlements(targetInstitutionId);
    await this.auditLog(user, AuditAction.STUDENT_INSTITUTION_CHANGED, 'STUDENT', id, { studentId: id, targetInstitutionId }, targetInstitutionId);
    return updated;
  }

  async setStudentStatus(user: RequestUser, id: string, status: 'ACTIVE' | 'DEACTIVATED' | 'ARCHIVED'): Promise<any> {
    this.assertSuperAdmin(user);
    const existing = await this.prisma.student.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Student not found');
    const updated = await this.prisma.student.update({
      where: { id },
      data: {
        status,
        deactivatedAt: status === 'DEACTIVATED' ? new Date() : null,
        archivedAt: status === 'ARCHIVED' ? new Date() : null,
      },
    });
    if (existing.userId) {
      await this.prisma.user.update({ where: { id: existing.userId }, data: { isActive: status === 'ACTIVE' } });
      this.entitlement.invalidate(existing.userId);
    }
    if (status === 'ARCHIVED') {
      await this.auditLog(user, AuditAction.STUDENT_ARCHIVED, 'STUDENT', id, { studentId: id });
    } else {
      await this.auditLog(user, status === 'ACTIVE' ? AuditAction.STUDENT_ENABLED : AuditAction.STUDENT_DISABLED, 'STUDENT', id, { studentId: id });
    }
    return updated;
  }

  async searchStudents(user: RequestUser, search: string): Promise<any[]> {
    this.assertSuperAdmin(user);
    const term = search?.trim();
    if (!term) return [];
    const rows = await this.prisma.student.findMany({
      where: {
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term, mode: 'insensitive' } },
          { rollNumber: { contains: term, mode: 'insensitive' } },
          { user: { name: { contains: term, mode: 'insensitive' } } },
        ],
      },
      select: { id: true, name: true, email: true, grade: true, institutionId: true },
      orderBy: { name: 'asc' },
      take: 20,
    });
    return Promise.all(
      rows.map(async (r) => {
        const sId = await this.systemId();
        const isDirect = !r.institutionId || r.institutionId === sId;
        return {
          id: r.id,
          name: r.name,
          email: r.email,
          grade: r.grade,
          institutionId: r.institutionId ?? sId,
          source: isDirect ? 'DIRECT_SANRO' : 'INSTITUTION',
        };
      }),
    );
  }

  async setDirectSubscription(user: RequestUser, id: string, data: { planKey: string; status: string; startsAt?: string; endsAt?: string; reason?: string }): Promise<any> {
    this.assertSuperAdmin(user);
    const status = data.status as (typeof SUB_STATUSES)[number];
    if (!SUB_STATUSES.includes(status)) throw new BadRequestException('Invalid subscription status');
    const student = await this.prisma.student.findUnique({ where: { id }, select: { id: true, userId: true } });
    if (!student) throw new NotFoundException('Student not found');
    if (!student.userId) throw new BadRequestException('Student has no user account');
    const plan = await this.prisma.plan.findUnique({ where: { key: data.planKey as 'STUDENT_MONTHLY' | 'STUDENT_YEARLY' | 'INSTITUTION' } });
    if (!plan) throw new BadRequestException('Subscription plan not found');
    const startsAt = data.startsAt ? new Date(data.startsAt) : new Date();
    const endsAt = data.endsAt ? new Date(data.endsAt) : null;
    const existing = await this.prisma.subscription.findUnique({ where: { userId: student.userId } });
    let subscription: any;
    if (existing) {
      subscription = await this.prisma.subscription.update({
        where: { id: existing.id },
        data: { planId: plan.id, status, startedAt: startsAt, endsAt },
        include: { plan: true },
      });
    } else {
      subscription = await this.prisma.subscription.create({
        data: { userId: student.userId, planId: plan.id, status, startedAt: startsAt, endsAt },
        include: { plan: true },
      });
    }
    await this.prisma.subscriptionHistory.create({
      data: {
        institutionId: null,
        subscriptionId: subscription.id,
        action: (existing ? 'UPDATED' : 'CREATED') as unknown as Prisma.SubscriptionHistoryCreateInput['action'],
        changedById: user.sub,
        oldPlanId: existing?.planId ?? null,
        newPlanId: plan.id,
        oldStatus: existing?.status ?? null,
        newStatus: status,
        oldStartsAt: existing?.startedAt ?? null,
        oldEndsAt: existing?.endsAt ?? null,
        newStartsAt: startsAt,
        newEndsAt: endsAt,
        reason: data.reason ?? null,
      },
    });
    await this.auditLog(user, existing ? AuditAction.DIRECT_SUBSCRIPTION_UPDATED : AuditAction.DIRECT_SUBSCRIPTION_CREATED, 'STUDENT', id, { studentId: id, planKey: data.planKey, status });
    this.entitlement.invalidate(student.userId);
    return { subscription: this.mapDirectSubscription(subscription) };
  }

  /* ============================= TEACHERS ============================= */

  async listTeachers(user: RequestUser, q: PeopleListQuery): Promise<ListResult<any>> {
    this.assertSuperAdmin(user);
    const { page, pageSize, skip, take } = this.paginate(q);
    const where: Prisma.TeacherWhereInput = {};
    if (q.institutionId) where.institutionId = q.institutionId;
    if (q.status) where.status = q.status as 'ACTIVE' | 'DEACTIVATED' | 'INVITED';
    if (q.search) {
      const term = q.search.trim();
      if (term) {
        where.OR = [
          { employeeId: { contains: term, mode: 'insensitive' } },
          { user: { name: { contains: term, mode: 'insensitive' } } },
        ];
      }
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.teacher.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true } },
          institution: { select: { id: true, name: true } },
          subjects: { include: { subject: { select: { id: true, name: true } } } },
          groups: { include: { group: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.teacher.count({ where }),
    ]);
    return { items: items.map((row) => this.mapTeacherListItem(row)), total, page, pageSize };
  }

  async teacherDetail(user: RequestUser, id: string): Promise<any> {
    this.assertSuperAdmin(user);
    const teacher: any = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true } },
        institution: { select: { id: true, name: true, type: true, status: true } },
        subjects: { include: { subject: { select: { id: true, name: true } } } },
        groups: { include: { group: { select: { id: true, name: true } } } },
      },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');
    const recentAudit = await this.prisma.auditLog.findMany({
      where: { entityType: 'TEACHER', entityId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { name: true, email: true } } },
    });
    const relatedUser: any = teacher.user ?? null;
    return {
      ...this.mapTeacherListItem(teacher),
      user: relatedUser ? { id: relatedUser.id, name: relatedUser.name, email: relatedUser.email, phone: relatedUser.phone ?? null, isActive: relatedUser.isActive, createdAt: relatedUser.createdAt } : null,
      institution: teacher.institution ? { ...teacher.institution } : null,
      academicYearId: null,
      recentAudit: this.mapAuditRows(recentAudit),
    };
  }
async createTeacher(user: RequestUser, data: any): Promise<any> {
    this.assertSuperAdmin(user);
    if (!data.institutionId) throw new BadRequestException('institutionId is required');
    const inst = await this.prisma.institution.findUnique({ where: { id: data.institutionId }, select: { id: true } });
    if (!inst) throw new BadRequestException('Institution not found');
    const email = data.email?.toLowerCase?.();
    const pwd = this.randomPassword();
    const created = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const dbUser = await tx.user.create({
        data: {
          name: data.name,
          email,
          phone: data.phone ?? null,
          passwordHash: await bcrypt.hash(pwd, 10),
          isActive: true,
        },
      });
      const teacher = await tx.teacher.create({
        data: {
          employeeId: data.employeeId ?? null,
          institutionId: data.institutionId,
          userId: dbUser.id,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: user.sub,
          institutionId: data.institutionId,
          action: AuditAction.TEACHER_ADDED,
          entityType: 'TEACHER',
          entityId: teacher.id,
          metadata: { email } as Prisma.InputJsonValue,
        },
      });
      return teacher;
    });
    await this.clearInstitutionEntitlements(data.institutionId);
    return { id: created.id, defaultPassword: pwd };
  }

  async updateTeacher(user: RequestUser, id: string, data: any): Promise<any> {
    this.assertSuperAdmin(user);
    const existing = await this.prisma.teacher.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Teacher not found');
    const updated = await this.prisma.teacher.update({
      where: { id },
      data: { employeeId: data.employeeId, status: data.status },
    });
    await this.auditLog(user, AuditAction.TEACHER_UPDATED, 'TEACHER', id, { teacherId: id });
    return updated;
  }

  async transferTeacher(user: RequestUser, id: string, targetInstitutionId: string): Promise<any> {
    this.assertSuperAdmin(user);
    const target = await this.prisma.institution.findUnique({ where: { id: targetInstitutionId }, select: { id: true } });
    if (!target) throw new BadRequestException('Target institution not found');
    const existing = await this.prisma.teacher.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Teacher not found');
    const updated = await this.prisma.teacher.update({
      where: { id },
      data: { institutionId: targetInstitutionId },
    });
    await this.clearInstitutionEntitlements(targetInstitutionId);
    await this.auditLog(user, AuditAction.TEACHER_INSTITUTION_CHANGED, 'TEACHER', id, { teacherId: id, targetInstitutionId }, targetInstitutionId);
    return updated;
  }

  async setTeacherStatus(user: RequestUser, id: string, status: 'ACTIVE' | 'DEACTIVATED'): Promise<any> {
    this.assertSuperAdmin(user);
    const existing = await this.prisma.teacher.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Teacher not found');
    const updated = await this.prisma.teacher.update({
      where: { id },
      data: {
        status,
        deactivatedAt: status === 'DEACTIVATED' ? new Date() : null,
      },
    });
    await this.prisma.user.update({ where: { id: existing.userId }, data: { isActive: status === 'ACTIVE' } });
    this.entitlement.invalidate(existing.userId);
    await this.auditLog(user, status === 'ACTIVE' ? AuditAction.TEACHER_ENABLED : AuditAction.TEACHER_DISABLED, 'TEACHER', id, { teacherId: id });
    return updated;
  }

  /* ============================= PARENTS ============================= */

  async listParents(user: RequestUser, q: PeopleListQuery): Promise<ListResult<any>> {
    this.assertSuperAdmin(user);
    const { page, pageSize, skip, take } = this.paginate(q);
    const where: Prisma.ParentWhereInput = {};
    const and: Prisma.ParentWhereInput[] = [];
    if (q.institutionId) {
      where.institutionId = q.institutionId;
    } else if (q.source === 'DIRECT_SANRO') {
      const sId = await this.systemId();
      and.push({ OR: [{ institutionId: sId }, { institutionId: null }] });
    } else if (q.source === 'INSTITUTION') {
      const sId = await this.systemId();
      where.institutionId = { notIn: [sId] };
    }
    if (q.search) {
      const term = q.search.trim();
      if (term) {
        and.push({
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
            { phone: { contains: term, mode: 'insensitive' } },
          ],
        });
      }
    }
    if (and.length) where.AND = and;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.parent.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true } },
          institution: { select: { id: true, name: true, type: true, status: true } },
          studentLinks: {
            include: {
              student: {
                include: {
                  institution: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.parent.count({ where }),
    ]);
    return { items: await Promise.all(items.map((row) => this.mapParentListItem(row))), total, page, pageSize };
  }

  async parentDetail(user: RequestUser, id: string): Promise<any> {
    this.assertSuperAdmin(user);
    const parent: any = await this.prisma.parent.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true } },
        institution: { select: { id: true, name: true, type: true, status: true } },
        studentLinks: {
          include: {
            student: {
              include: {
                institution: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
    if (!parent) throw new NotFoundException('Parent not found');
    const recentAudit = await this.prisma.auditLog.findMany({
      where: { entityType: 'PARENT', entityId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { name: true, email: true } } },
    });
    const relatedUser: any = parent.user ?? null;
    return {
      ...(await this.mapParentListItem(parent)),
      user: relatedUser ? { id: relatedUser.id, name: relatedUser.name, email: relatedUser.email, phone: relatedUser.phone ?? null, isActive: relatedUser.isActive, createdAt: relatedUser.createdAt } : null,
      institution: parent.institution ? { ...parent.institution } : null,
      recentAudit: this.mapAuditRows(recentAudit),
    };
  }

  async createParent(user: RequestUser, data: any): Promise<any> {
    this.assertSuperAdmin(user);
    const email = data.email?.toLowerCase?.();
    const pwd = this.randomPassword();
    const sId = await this.systemId();
    let instId = sId;
    if (data.institutionId) {
      if (data.institutionId === sId) {
        throw new ConflictException('The SANRO AI system institution cannot be used as a tenant institution for a parent');
      }
      const inst = await this.prisma.institution.findUnique({ where: { id: data.institutionId }, select: { id: true } });
      if (!inst) throw new BadRequestException('Institution not found');
      instId = data.institutionId;
    }
    const created = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const dbUser = await tx.user.create({
        data: {
          name: data.name,
          email,
          phone: data.phone ?? null,
          passwordHash: await bcrypt.hash(pwd, 10),
          isActive: true,
        },
      });
      const parent = await tx.parent.create({
        data: {
          name: data.name,
          email,
          phone: data.phone ?? null,
          institutionId: instId,
          userId: dbUser.id,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: user.sub,
          institutionId: instId,
          action: AuditAction.PARENT_UPDATED,
          entityType: 'PARENT',
          entityId: parent.id,
          metadata: { email } as Prisma.InputJsonValue,
        },
      });
      return parent;
    });
    return { id: created.id, defaultPassword: pwd };
  }

  async updateParent(user: RequestUser, id: string, data: any): Promise<any> {
    this.assertSuperAdmin(user);
    const existing = await this.prisma.parent.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Parent not found');
    const email = data.email?.toLowerCase?.() ?? existing.email;
    const updated = await this.prisma.parent.update({
      where: { id },
      data: { name: data.name, email, phone: data.phone },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    await this.auditLog(user, AuditAction.PARENT_UPDATED, 'PARENT', id, { parentId: id });
    return updated;
  }

  async linkParentToStudent(user: RequestUser, parentId: string, studentId: string): Promise<any> {
    this.assertSuperAdmin(user);
    const parent = await this.prisma.parent.findUnique({ where: { id: parentId }, select: { id: true } });
    const student = await this.prisma.student.findUnique({ where: { id: studentId }, select: { id: true } });
    if (!parent) throw new NotFoundException('Parent not found');
    if (!student) throw new NotFoundException('Student not found');
    const link = await this.prisma.parentStudentLink.upsert({
      where: { parentId_studentId: { parentId, studentId } },
      create: { parentId, studentId },
      update: {},
    });
    await this.auditLog(user, AuditAction.PARENT_CHILD_LINKED, 'PARENT', parentId, { parentId, studentId });
    return link;
  }

  async unlinkParentFromStudent(user: RequestUser, parentId: string, studentId: string): Promise<void> {
    this.assertSuperAdmin(user);
    const link = await this.prisma.parentStudentLink.findUnique({ where: { parentId_studentId: { parentId, studentId } } });
    if (!link) throw new NotFoundException('Parent-student link not found');
    await this.prisma.parentStudentLink.delete({ where: { parentId_studentId: { parentId, studentId } } });
    await this.auditLog(user, AuditAction.PARENT_CHILD_UNLINKED, 'PARENT', parentId, { parentId, studentId });
  }

  async setParentStatus(user: RequestUser, id: string, status: 'ACTIVE' | 'DEACTIVATED'): Promise<any> {
    this.assertSuperAdmin(user);
    const existing = await this.prisma.parent.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Parent not found');
    if (existing.userId) {
      await this.prisma.user.update({ where: { id: existing.userId }, data: { isActive: status === 'ACTIVE' } });
      this.entitlement.invalidate(existing.userId);
    }
    await this.auditLog(user, status === 'ACTIVE' ? AuditAction.PARENT_ENABLED : AuditAction.PARENT_DISABLED, 'PARENT', id, { parentId: id });
    return existing;
  }

  private randomPassword(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const parts = [2, 2, 2, 4];
    return parts.map((n) => Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')).join('-');
  }
}