import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcryptjs';
import { ImportEntityType, ImportStatus, ImportRowStatus } from '@sanro/types';
import { IMPORT_LIMITS } from '@sanro/config';
import { Prisma } from '@prisma/client';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';
import { SubscriptionAccessService } from '../common/security/subscription-access.service';
import { AuditService } from '../common/services/audit-notifications.service';

interface ParsedRow {
  rowNumber: number;
  name: string;
  email: string;
  phone: string;
  rollNumber?: string;
  parentName?: string;
  parentPhone?: string;
  gender?: string;
  dateOfBirth?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s-]{8,15}$/;

function parseSheet(buffer: Buffer, filename: string): Array<Record<string, unknown>> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new BadRequestException('No sheet found in the file');
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  if (rows.length === 0) throw new BadRequestException('The file has no data rows');
  if (rows.length > IMPORT_LIMITS.MAX_ROWS) {
    throw new BadRequestException(`Maximum ${IMPORT_LIMITS.MAX_ROWS} rows allowed per import`);
  }
  void filename;
  return rows;
}

function getString(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

function validateRow(raw: Record<string, unknown>, idx: number): { value?: ParsedRow; error?: string } {
  const name = getString(raw, 'name', 'studentName', 'Student Name');
  if (name.length < 2) return { error: `Row ${idx}: Name is required (min 2 characters)` };

  const email = getString(raw, 'email', 'Email');
  if (email && !EMAIL_REGEX.test(email)) return { error: `Row ${idx}: Invalid email "${email}"` };

  const phone = getString(raw, 'phone', 'Phone', 'Mobile');
  if (phone && !PHONE_REGEX.test(phone)) return { error: `Row ${idx}: Invalid phone "${phone}"` };

  const parentPhone = getString(raw, 'parentPhone', 'Parent Phone');
  if (parentPhone && !PHONE_REGEX.test(parentPhone)) {
    return { error: `Row ${idx}: Invalid parent phone "${parentPhone}"` };
  }

  return {
    value: {
      rowNumber: idx,
      name,
      email,
      phone,
      rollNumber: getString(raw, 'rollNumber', 'Roll No', 'Roll Number') || undefined,
      parentName: getString(raw, 'parentName', 'Parent Name') || undefined,
      parentPhone: parentPhone || undefined,
      gender: getString(raw, 'gender') || undefined,
      dateOfBirth: getString(raw, 'dateOfBirth', 'Date of Birth') || undefined,
    },
  };
}

@Injectable()
export class ImportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
    private readonly subscription: SubscriptionAccessService,
    private readonly audit: AuditService,
  ) {}

  async preview(user: RequestUser, entityType: ImportEntityType, academicYearId: string, file: Express.Multer.File) {
    const institutionId = this.tenant.requireInstitution(user);
    if (user.role !== 'INSTITUTION_ADMIN' && user.role !== 'TEACHER' && user.role !== 'SUPER_ADMIN') {
      throw new BadRequestException('Only administrators and teachers can import data');
    }
    if (file.size > IMPORT_LIMITS.MAX_FILE_BYTES) {
      throw new BadRequestException(`File exceeds the ${IMPORT_LIMITS.MAX_FILE_BYTES / 1024 / 1024} MB limit`);
    }

    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: academicYearId, institutionId },
    });
    if (!academicYear) throw new BadRequestException('Invalid academic year');

    const rows = parseSheet(file.buffer, file.originalname);
    const parsed = rows.map((r, i) => validateRow(r, i + 2));

    const valid = parsed.filter((p) => !!p.value).map((p) => p.value as ParsedRow);
    const invalid = parsed.filter((p) => !!p.error).map((p) => p.error as string);

    const job = await this.prisma.importJob.create({
      data: {
        institutionId,
        academicYearId,
        entityType,
        fileName: file.originalname,
        originalName: file.originalname,
        status: 'VALIDATED',
        totalRows: rows.length,
        validRows: valid.length,
        invalidRows: invalid.length,
        createdById: user.sub,
        rows: {
          create: rows.map((r, i) => {
            const p = parsed[i];
            return {
              rowNumber: i + 2,
              name: p.value?.name ?? null,
              status: p.error ? ImportRowStatus.INVALID : ImportRowStatus.VALID,
              errors: p.error ? [p.error] : [],
              data: r as object,
            };
          }),
        },
      },
      include: { rows: true },
    });

    return {
      jobId: job.id,
      totalRows: job.totalRows,
      validRows: job.validRows,
      invalidRows: job.invalidRows,
      entityType,
      errors: invalid,
      requiresCommit: true,
    };
  }

  async commit(user: RequestUser, jobId: string): Promise<{ imported: number; duplicates: number; errors: string[] }> {
    const institutionId = this.tenant.requireInstitution(user);
    const job = await this.prisma.importJob.findFirst({
      where: { id: jobId, institutionId },
      include: { rows: { where: { status: 'VALID' } } },
    });
    if (!job) throw new NotFoundException('Import job not found');
    if (job.status === 'COMMITTED') throw new BadRequestException('Import already committed');

    const academicYearId = job.academicYearId;
    const errors: string[] = [];
    let imported = 0;
    let duplicates = 0;

    const results = await this.prisma.$transaction(async (tx) => {
      if (job.entityType === 'STUDENTS' || job.entityType === 'TEACHERS') {
        const seats = await this.subscription.seatAvailability(institutionId, job.rows.length, tx);
        if (!seats.allowed) {
          throw new BadRequestException({
            code: 'USER_LIMIT_REACHED',
            message:
              'User limit reached. Please contact your SANRO administrator to increase your subscription limit.',
            details: {
              current: seats.current,
              requested: job.rows.length,
              available: seats.available,
              limit: seats.limit,
            },
          });
        }
      }
      for (const row of job.rows) {
        const data = row.data as Record<string, unknown>;
        const value = validateRow(data, row.rowNumber).value;
        if (!value) continue;

        if (job.entityType === 'STUDENTS') {
          const existing = await tx.student.findFirst({
            where: {
              institutionId,
              OR: [
                ...(value.email ? [{ email: value.email }] : []),
                ...(value.rollNumber ? [{ rollNumber: value.rollNumber }] : []),
              ],
            },
          });
          if (existing) {
            duplicates++;
            await tx.importRow.update({
              where: { id: row.id },
              data: { status: ImportRowStatus.EXISTING, errors: ['Record already exists'] },
            });
            continue;
          }
          const student = await this.createStudentRecord(tx, institutionId, academicYearId, value);
          await tx.importRow.update({
            where: { id: row.id },
            data: { status: ImportRowStatus.IMPORTED, importedEntityId: student.id },
          });
          imported++;
          continue;
        }

        const existingTeacher = await tx.user.findFirst({
          where: {
            OR: [
              ...(value.email ? [{ email: value.email }] : []),
              ...(value.phone ? [{ phone: value.phone }] : []),
            ],
          },
        });
        if (existingTeacher) {
          duplicates++;
          await tx.importRow.update({
            where: { id: row.id },
            data: { status: ImportRowStatus.EXISTING, errors: ['Record already exists'] },
          });
          continue;
        }
        const teacher = await this.createTeacherRecord(tx, institutionId, value);
        await tx.importRow.update({
          where: { id: row.id },
          data: { status: ImportRowStatus.IMPORTED, importedEntityId: teacher.id },
        });
        imported++;
      }
      return { inTransaction: true };
    });
    void results;

    await this.prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: 'COMMITTED' as ImportStatus,
        importedRows: imported,
        duplicateRows: duplicates,
        invalidRows: job.invalidRows,
        completedAt: new Date(),
      },
    });

    await this.audit.log({
      userId: user.sub,
      institutionId,
      action: job.entityType === 'STUDENTS' ? 'STUDENT_IMPORTED' : 'TEACHER_ADDED',
      entityType: 'ImportJob',
      entityId: job.id,
      metadata: { imported, duplicates, invalid: job.invalidRows },
    });

    return { imported, duplicates, errors };
  }

  private async createStudentRecord(
    tx: Prisma.TransactionClient,
    institutionId: string,
    academicYearId: string,
    value: ParsedRow,
  ) {
    const hasAccount = !!value.email || !!value.phone;
    let userId: string | null = null;
    if (hasAccount) {
      const passwordHash = await bcrypt.hash(value.phone ? value.phone.slice(-6) : 'sanro123', 10);
      const user = await tx.user.create({
        data: {
          name: value.name,
          email: value.email || `${value.name.replace(/\s+/g, '.').toLowerCase()}-${Date.now()}@temp.sanro.in`,
          phone: value.phone ?? null,
          passwordHash,
          isSuperAdmin: false,
        },
      });
      await tx.institutionMember.create({
        data: { institutionId, userId: user.id, role: 'STUDENT', status: 'ACTIVE' },
      });
      userId = user.id;
    }
    const dbDate = value.dateOfBirth ? new Date(value.dateOfBirth) : null;
    const student = await tx.student.create({
      data: {
        institutionId,
        academicYearId,
        name: value.name,
        email: value.email ?? null,
        phone: value.phone ?? null,
        gender: value.gender ?? null,
        dateOfBirth: dbDate && !Number.isNaN(dbDate.getTime()) ? dbDate : null,
        rollNumber: value.rollNumber ?? null,
        status: 'ACTIVE',
        userId,
      },
    });

    if (value.parentName || value.parentPhone) {
      const parentUser = await tx.user.create({
        data: {
          name: value.parentName ?? `${value.name}'s Parent`,
          email: `par.${value.email ?? value.name.replace(/\s+/g, '.')}.${student.id.slice(0, 8)}@temp.sanro.in`,
          phone: value.parentPhone ?? null,
          passwordHash: await bcrypt.hash(value.parentPhone ? value.parentPhone.slice(-6) : 'sanro123', 10),
          isSuperAdmin: false,
        },
      });
      await tx.institutionMember.create({
        data: { institutionId, userId: parentUser.id, role: 'PARENT', status: 'ACTIVE' },
      });
      const parent = await tx.parent.create({
        data: { institutionId, userId: parentUser.id, name: parentUser.name, email: parentUser.email, phone: parentUser.phone },
      });
      await tx.parentStudentLink.create({
        data: { parentId: parent.id, studentId: student.id },
      });
    }
    return student;
  }

  private async createTeacherRecord(tx: Prisma.TransactionClient, institutionId: string, value: ParsedRow) {
    const passwordHash = await bcrypt.hash(value.phone ? value.phone.slice(-6) : 'sanro123', 10);
    const user = await tx.user.create({
      data: {
        name: value.name,
        email: value.email,
        phone: value.phone ?? null,
        passwordHash,
        isSuperAdmin: false,
      },
    });
    await tx.institutionMember.create({
      data: { institutionId, userId: user.id, role: 'TEACHER', status: 'ACTIVE' },
    });
    const teacher = await tx.teacher.create({
      data: {
        institutionId,
        userId: user.id,
        employeeId: value.rollNumber ?? null,
      },
    });
    return teacher;
  }

  async history(user: RequestUser) {
    const institutionId = this.tenant.requireInstitution(user);
    return this.prisma.importJob.findMany({
      where: { institutionId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { rows: true } },
      },
      take: 50,
    });
  }

  async jobDetail(user: RequestUser, jobId: string) {
    const institutionId = this.tenant.requireInstitution(user);
    const job = await this.prisma.importJob.findFirst({
      where: { id: jobId, institutionId },
      include: {
        rows: { orderBy: { rowNumber: 'asc' }, take: 500 },
        createdBy: { select: { name: true } },
      },
    });
    if (!job) throw new NotFoundException('Import job not found');
    return job;
  }
}