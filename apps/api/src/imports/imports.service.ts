import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcryptjs';
import {
  ImportEntityType,
  ImportStatus,
  ImportRowStatus,
  ContentType,
  ContentStatus,
  QuestionType,
  QuestionStatus,
  Difficulty,
  Language,
  AuditAction,
} from '@sanro/types';
import { IMPORT_LIMITS } from '@sanro/config';
import { AcademicYearStatus, Prisma } from '@prisma/client';
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
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

function normKey(key: string): string {
  return key.toLowerCase().replace(/[\s_-]+/g, '');
}

function getString(row: Record<string, unknown>, ...keys: string[]): string {
  const wanted = keys.map(normKey);
  for (const k of Object.keys(row)) {
    if (!wanted.includes(normKey(k))) continue;
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
      rollNumber: getString(raw, 'rollNumber', 'Roll No', 'Roll Number', 'employeeId') || undefined,
      parentName: getString(raw, 'parentName', 'Parent Name') || undefined,
      parentPhone: parentPhone || undefined,
      gender: getString(raw, 'gender') || undefined,
      dateOfBirth: getString(raw, 'dateOfBirth', 'Date of Birth') || undefined,
    },
  };
}

interface ContentParsedRow {
  rowNumber: number;
  name: string;
  type: ContentType;
  title: string;
  description?: string;
  url?: string;
  board: string;
  grade: string;
  subject: string;
  chapter: string;
  topic?: string;
  concept?: string;
  order: number;
  status: ContentStatus;
  language: Language;
}

interface QuestionParsedRow {
  rowNumber: number;
  name: string;
  type: QuestionType;
  text: string;
  answer: string;
  options: string[];
  correctIndex: number;
  board: string;
  grade: string;
  subject: string;
  chapter: string;
  topic?: string;
  concept?: string;
  difficulty: Difficulty;
  marks: number;
  status: QuestionStatus;
  language: Language;
  hint?: string;
  explanation?: string;
}

interface ParentParsedRow {
  rowNumber: number;
  name: string;
  email: string;
  phone?: string;
  studentEmail?: string;
}

type EntityParsedRow = ParsedRow | ContentParsedRow | QuestionParsedRow | ParentParsedRow;
type RowCheck = { value?: EntityParsedRow; error?: string };

const SUPPORTED_ENTITY_TYPES: string[] = ['STUDENTS', 'TEACHERS', 'PARENTS', 'CONTENT', 'QUESTIONS'];

const CONTENT_TYPES = new Set<string>(Object.values(ContentType));
const CONTENT_STATUSES = new Set<string>(Object.values(ContentStatus));
const QUESTION_TYPES = new Set<string>(Object.values(QuestionType));
const QUESTION_STATUSES = new Set<string>(Object.values(QuestionStatus));
const DIFFICULTIES = new Set<string>(Object.values(Difficulty));
const LANGUAGES = new Set<string>(Object.values(Language));

function validateContentRow(raw: Record<string, unknown>, idx: number): RowCheck {
  const type = getString(raw, 'type', 'contentType').toUpperCase();
  if (!type) return { error: `Row ${idx}: Content type is required` };
  if (!CONTENT_TYPES.has(type)) return { error: `Row ${idx}: Unknown content type "${type}"` };

  const title = getString(raw, 'title', 'name');
  if (title.length < 2) return { error: `Row ${idx}: Title is required (min 2 characters)` };

  const board = getString(raw, 'board');
  if (!board) return { error: `Row ${idx}: Board is required` };
  const grade = getString(raw, 'grade', 'class');
  if (!grade) return { error: `Row ${idx}: Grade is required` };
  const subject = getString(raw, 'subject');
  if (!subject) return { error: `Row ${idx}: Subject is required` };
  const chapter = getString(raw, 'chapter');
  if (!chapter) return { error: `Row ${idx}: Chapter is required` };

  const url = getString(raw, 'url', 'link');
  if (url && !/^https?:\/\/\S+$/i.test(url)) {
    return { error: `Row ${idx}: URL must start with http:// or https://` };
  }

  const statusRaw = (getString(raw, 'status') || ContentStatus.APPROVED).toUpperCase();
  if (!CONTENT_STATUSES.has(statusRaw)) return { error: `Row ${idx}: Unknown status "${statusRaw}"` };

  const languageRaw = (getString(raw, 'language') || Language.EN).toUpperCase();
  if (!LANGUAGES.has(languageRaw)) return { error: `Row ${idx}: Unknown language "${languageRaw}"` };

  const orderRaw = getString(raw, 'order', 'sortOrder');
  let order = 0;
  if (orderRaw) {
    const parsed = Number(orderRaw);
    if (!Number.isFinite(parsed)) return { error: `Row ${idx}: Order must be a number` };
    order = Math.trunc(parsed);
  }

  return {
    value: {
      rowNumber: idx,
      name: title,
      type: type as ContentType,
      title,
      description: getString(raw, 'description', 'summary') || undefined,
      url: url || undefined,
      board,
      grade,
      subject,
      chapter,
      topic: getString(raw, 'topic') || undefined,
      concept: getString(raw, 'concept') || undefined,
      order,
      status: statusRaw as ContentStatus,
      language: languageRaw as Language,
    },
  };
}

function validateQuestionRow(raw: Record<string, unknown>, idx: number): RowCheck {
  const type = getString(raw, 'type', 'questionType').toUpperCase();
  if (!type) return { error: `Row ${idx}: Question type is required` };
  if (!QUESTION_TYPES.has(type)) return { error: `Row ${idx}: Unknown question type "${type}"` };

  const text = getString(raw, 'text', 'question', 'questionText');
  if (text.length < 5) return { error: `Row ${idx}: Question text is required (min 5 characters)` };

  const board = getString(raw, 'board');
  if (!board) return { error: `Row ${idx}: Board is required` };
  const grade = getString(raw, 'grade', 'class');
  if (!grade) return { error: `Row ${idx}: Grade is required` };
  const subject = getString(raw, 'subject');
  if (!subject) return { error: `Row ${idx}: Subject is required` };
  const chapter = getString(raw, 'chapter');
  if (!chapter) return { error: `Row ${idx}: Chapter is required` };

  const options = getString(raw, 'options', 'choices', 'choicesList')
    .split('|')
    .map((o) => o.trim())
    .filter(Boolean);
  const markedIndex = options.findIndex((o) => o.startsWith('*'));
  const cleanOptions = options.map((o) => (o.startsWith('*') ? o.slice(1).trim() : o));
  const explicitAnswer = getString(raw, 'answer', 'correctAnswer', 'answerKey');
  const answer = (markedIndex >= 0 ? cleanOptions[markedIndex] : '') || explicitAnswer;
  if (!answer) {
    return { error: `Row ${idx}: Answer is required (or prefix the correct option with *)` };
  }

  const objective =
    type === QuestionType.MCQ || type === QuestionType.MULTI_SELECT || type === QuestionType.TRUE_FALSE;
  let correctIndex = -1;
  if (objective) {
    if (type !== QuestionType.TRUE_FALSE && cleanOptions.length < 2) {
      return {
        error: `Row ${idx}: ${type} needs at least 2 pipe-separated options, with the correct one prefixed by *`,
      };
    }
    if (markedIndex >= 0) correctIndex = markedIndex;
    else {
      const hit = cleanOptions.findIndex((o) => o.toLowerCase() === answer.toLowerCase());
      if (hit < 0) {
        return {
          error: `Row ${idx}: Answer "${answer}" does not match any option — prefix the correct option with *`,
        };
      }
      correctIndex = hit;
    }
  }

  if (type === QuestionType.TRUE_FALSE) {
    const normalized = answer.toLowerCase();
    if (normalized !== 'true' && normalized !== 'false') {
      return { error: `Row ${idx}: TRUE_FALSE answer must be True or False` };
    }
  }

  const difficultyRaw = (getString(raw, 'difficulty') || Difficulty.MEDIUM).toUpperCase();
  if (!DIFFICULTIES.has(difficultyRaw)) return { error: `Row ${idx}: Unknown difficulty "${difficultyRaw}"` };

  const statusRaw = (getString(raw, 'status') || QuestionStatus.APPROVED).toUpperCase();
  if (!QUESTION_STATUSES.has(statusRaw)) return { error: `Row ${idx}: Unknown status "${statusRaw}"` };

  const languageRaw = (getString(raw, 'language') || Language.EN).toUpperCase();
  if (!LANGUAGES.has(languageRaw)) return { error: `Row ${idx}: Unknown language "${languageRaw}"` };

  const marksRaw = getString(raw, 'marks', 'mark');
  let marks = 1;
  if (marksRaw) {
    const parsed = Number(marksRaw);
    if (!Number.isFinite(parsed) || parsed <= 0) return { error: `Row ${idx}: Marks must be a positive number` };
    marks = Math.max(1, Math.trunc(parsed));
  }

  return {
    value: {
      rowNumber: idx,
      name: text.slice(0, 120),
      type: type as QuestionType,
      text,
      answer,
      options: cleanOptions,
      correctIndex,
      board,
      grade,
      subject,
      chapter,
      topic: getString(raw, 'topic') || undefined,
      concept: getString(raw, 'concept') || undefined,
      difficulty: difficultyRaw as Difficulty,
      marks,
      status: statusRaw as QuestionStatus,
      language: languageRaw as Language,
      hint: getString(raw, 'hint') || undefined,
      explanation: getString(raw, 'explanation') || undefined,
    },
  };
}

function validateParentRow(raw: Record<string, unknown>, idx: number): RowCheck {
  const name = getString(raw, 'name', 'parentName');
  if (name.length < 2) return { error: `Row ${idx}: Name is required (min 2 characters)` };

  const email = getString(raw, 'email');
  if (!email) return { error: `Row ${idx}: Email is required for parent accounts` };
  if (!EMAIL_REGEX.test(email)) return { error: `Row ${idx}: Invalid email "${email}"` };

  const phone = getString(raw, 'phone', 'mobile');
  if (phone && !PHONE_REGEX.test(phone)) return { error: `Row ${idx}: Invalid phone "${phone}"` };

  const studentEmail = getString(raw, 'studentEmail', 'student');
  if (studentEmail && !EMAIL_REGEX.test(studentEmail)) {
    return { error: `Row ${idx}: Invalid student email "${studentEmail}"` };
  }

  return {
    value: {
      rowNumber: idx,
      name,
      email,
      phone: phone || undefined,
      studentEmail: studentEmail || undefined,
    },
  };
}

function validateEntityRow(entityType: string, raw: Record<string, unknown>, idx: number): RowCheck {
  if (entityType === 'CONTENT') return validateContentRow(raw, idx);
  if (entityType === 'QUESTIONS') return validateQuestionRow(raw, idx);
  if (entityType === 'PARENTS') return validateParentRow(raw, idx);
  const check = validateRow(raw, idx);
  if (check.error || !check.value) return check;
  if (entityType === 'TEACHERS' && !check.value.email) {
    return { error: `Row ${idx}: Email is required for teacher accounts` };
  }
  return check;
}

interface ResolvedCurriculum {
  boardId: string;
  grade: string;
  subjectId: string;
  chapterId: string;
  topicId: string | null;
  conceptId: string | null;
}

type ResolutionResult = { parents: ResolvedCurriculum | null; reason: string | null };
type ResolutionCache = Map<string, ResolutionResult>;

@Injectable()
export class ImportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
    private readonly subscription: SubscriptionAccessService,
    private readonly audit: AuditService,
  ) {}

  async preview(
    user: RequestUser,
    entityType: ImportEntityType,
    academicYearId: string,
    file: Express.Multer.File,
    requestedInstitutionId?: string,
  ) {
    if (user.role !== 'INSTITUTION_ADMIN' && user.role !== 'TEACHER' && user.role !== 'SUPER_ADMIN') {
      throw new BadRequestException('Only administrators and teachers can import data');
    }
    const institutionId = this.tenant.assertInstitutionAccess(user, requestedInstitutionId);
    if (!institutionId) throw new BadRequestException('Select an institution to import into');
    if (file.size > IMPORT_LIMITS.MAX_FILE_BYTES) {
      throw new BadRequestException(`File exceeds the ${IMPORT_LIMITS.MAX_FILE_BYTES / 1024 / 1024} MB limit`);
    }
    if (!SUPPORTED_ENTITY_TYPES.includes(entityType)) {
      throw new BadRequestException(`Unsupported entity type "${entityType}"`);
    }

    const requestedYearId = (academicYearId ?? '').trim();
    if (requestedYearId && !UUID_RE.test(requestedYearId)) {
      throw new BadRequestException('Invalid academic year');
    }
    const academicYear = requestedYearId
      ? await this.prisma.academicYear.findFirst({ where: { id: requestedYearId, institutionId } })
      : await this.prisma.academicYear.findFirst({
          where: { institutionId, status: AcademicYearStatus.ACTIVE },
          orderBy: { startDate: 'desc' },
        });
    if (!academicYear) {
      throw new BadRequestException(
        requestedYearId
          ? 'Invalid academic year for this institution'
          : 'No active academic year for this institution',
      );
    }
    const resolvedYearId = academicYear.id;

    const rows = parseSheet(file.buffer, file.originalname);
    const needsCurriculum = entityType === 'CONTENT' || entityType === 'QUESTIONS';
    const needsStudent = entityType === 'PARENTS';
    const cache: ResolutionCache = new Map();
    const studentCache = new Map<string, string | null>();
    const errors: string[] = [];
    const checks: Array<{ rowNumber: number; name: string | null; error?: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2;
      const check = validateEntityRow(entityType, rows[i], rowNumber);
      if (check.error || !check.value) {
        const message = check.error ?? `Row ${rowNumber}: invalid data`;
        errors.push(message);
        checks.push({ rowNumber, name: null, error: message });
        continue;
      }
      if (needsCurriculum) {
        const ref = check.value as ContentParsedRow | QuestionParsedRow;
        const resolved = await this.resolveCurriculumCached(this.prisma, cache, ref);
        if (!resolved.parents) {
          const message = `Row ${rowNumber}: ${resolved.reason ?? 'curriculum references not found'}`;
          errors.push(message);
          checks.push({ rowNumber, name: ref.name, error: message });
          continue;
        }
      }
      if (needsStudent) {
        const ref = check.value as ParentParsedRow;
        if (ref.studentEmail && !(await this.lookupStudent(this.prisma, institutionId, ref.studentEmail, studentCache))) {
          const message = `Row ${rowNumber}: Student "${ref.studentEmail}" not found in this institution`;
          errors.push(message);
          checks.push({ rowNumber, name: ref.name, error: message });
          continue;
        }
      }
      checks.push({ rowNumber, name: check.value.name });
    }

    const validRows = checks.filter((c) => !c.error).length;

    const job = await this.prisma.importJob.create({
      data: {
        institutionId,
        academicYearId: resolvedYearId,
        entityType,
        fileName: file.originalname,
        originalName: file.originalname,
        status: 'VALIDATED',
        totalRows: rows.length,
        validRows,
        invalidRows: checks.length - validRows,
        createdById: user.sub,
        rows: {
          create: checks.map((c, i) => ({
            rowNumber: c.rowNumber,
            name: c.name,
            status: c.error ? ImportRowStatus.INVALID : ImportRowStatus.VALID,
            errors: c.error ? [c.error] : [],
            data: rows[i] as object,
          })),
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
      errors,
      requiresCommit: true,
    };
  }

  private async resolveCurriculum(
    db: Prisma.TransactionClient | PrismaService,
    ref: {
      board: string;
      grade: string;
      subject: string;
      chapter: string;
      topic?: string;
      concept?: string;
    },
  ): Promise<ResolutionResult> {
    const board = await db.board.findFirst({
      where: { OR: [{ code: ref.board.toUpperCase() }, { name: ref.board }] },
      select: { id: true },
    });
    if (!board) return { parents: null, reason: `Board "${ref.board}" not found` };

    const grade = await db.grade.findFirst({
      where: { boardId: board.id, name: ref.grade },
      select: { id: true },
    });
    if (!grade) return { parents: null, reason: `Grade "${ref.grade}" not found on board "${ref.board}"` };

    const subject = await db.subject.findFirst({
      where: { boardId: board.id, OR: [{ code: ref.subject.toUpperCase() }, { name: ref.subject }] },
      select: { id: true },
    });
    if (!subject) return { parents: null, reason: `Subject "${ref.subject}" not found` };

    const chapter = await db.chapter.findFirst({
      where: { subjectId: subject.id, OR: [{ code: ref.chapter.toUpperCase() }, { name: ref.chapter }] },
      select: { id: true, grade: true },
    });
    if (!chapter) {
      return { parents: null, reason: `Chapter "${ref.chapter}" not found in subject "${ref.subject}"` };
    }

    let topicId: string | null = null;
    let conceptId: string | null = null;
    if (ref.topic) {
      const topic = await db.topic.findFirst({
        where: { chapterId: chapter.id, name: ref.topic },
        select: { id: true },
      });
      if (!topic) {
        return { parents: null, reason: `Topic "${ref.topic}" not found in chapter "${ref.chapter}"` };
      }
      topicId = topic.id;
      if (ref.concept) {
        const concept = await db.concept.findFirst({
          where: { topicId: topic.id, name: ref.concept },
          select: { id: true },
        });
        if (!concept) {
          return { parents: null, reason: `Concept "${ref.concept}" not found in topic "${ref.topic}"` };
        }
        conceptId = concept.id;
      }
    } else if (ref.concept) {
      return { parents: null, reason: `"concept" requires a "topic"` };
    }

    return {
      parents: {
        boardId: board.id,
        grade: chapter.grade,
        subjectId: subject.id,
        chapterId: chapter.id,
        topicId,
        conceptId,
      },
      reason: null,
    };
  }

  private async resolveCurriculumCached(
    db: Prisma.TransactionClient | PrismaService,
    cache: ResolutionCache,
    ref: {
      board: string;
      grade: string;
      subject: string;
      chapter: string;
      topic?: string;
      concept?: string;
    },
  ): Promise<ResolutionResult> {
    const key = [ref.board, ref.grade, ref.subject, ref.chapter, ref.topic ?? '', ref.concept ?? '']
      .join('|')
      .toLowerCase();
    const hit = cache.get(key);
    if (hit) return hit;
    const result = await this.resolveCurriculum(db, ref);
    cache.set(key, result);
    return result;
  }

  private async lookupStudent(
    db: Prisma.TransactionClient | PrismaService,
    institutionId: string,
    email: string,
    cache: Map<string, string | null>,
  ): Promise<string | null> {
    const key = email.toLowerCase();
    if (cache.has(key)) return cache.get(key) ?? null;
    const student = await db.student.findFirst({
      where: { institutionId, email: { equals: key, mode: 'insensitive' } },
      select: { id: true },
    });
    const id = student?.id ?? null;
    cache.set(key, id);
    return id;
  }

  async commit(user: RequestUser, jobId: string): Promise<{ imported: number; duplicates: number; errors: string[] }> {
    const scoped = this.tenant.assertInstitutionAccess(user);
    const job = await this.prisma.importJob.findFirst({
      where: { id: jobId, ...(scoped ? { institutionId: scoped } : {}) },
      include: { rows: { where: { status: 'VALID' } } },
    });
    if (!job) throw new NotFoundException('Import job not found');
    if (job.status === 'COMMITTED') throw new BadRequestException('Import already committed');

    const institutionId = job.institutionId;
    const academicYearId = job.academicYearId;
    const errors: string[] = [];
    const cache: ResolutionCache = new Map();
    const studentCache = new Map<string, string | null>();
    let imported = 0;
    let duplicates = 0;

    const markRow = async (
      tx: Prisma.TransactionClient,
      rowId: string,
      status: ImportRowStatus,
      rowErrors: string[],
      importedEntityId?: string,
    ) => {
      await tx.importRow.update({
        where: { id: rowId },
        data: { status, errors: rowErrors, ...(importedEntityId ? { importedEntityId } : {}) },
      });
    };

    const results = await this.prisma.$transaction(async (tx) => {
      if (
        job.entityType === 'STUDENTS' ||
        job.entityType === 'TEACHERS' ||
        job.entityType === 'PARENTS'
      ) {
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
        const check = validateEntityRow(job.entityType, data, row.rowNumber);
        if (check.error || !check.value) {
          const message = check.error ?? `Row ${row.rowNumber}: invalid data`;
          errors.push(message);
          await markRow(tx, row.id, ImportRowStatus.INVALID, [message]);
          continue;
        }

        if (job.entityType === 'CONTENT') {
          const value = check.value as ContentParsedRow;
          const { parents, reason } = await this.resolveCurriculumCached(tx, cache, value);
          if (!parents) {
            const message = `Row ${row.rowNumber}: ${reason ?? 'curriculum references not found'}`;
            errors.push(message);
            await markRow(tx, row.id, ImportRowStatus.INVALID, [message]);
            continue;
          }
          const existing = await tx.contentItem.findFirst({
            where: { institutionId, chapterId: parents.chapterId, title: value.title },
            select: { id: true },
          });
          if (existing) {
            duplicates++;
            await markRow(tx, row.id, ImportRowStatus.EXISTING, ['Record already exists']);
            continue;
          }
          const created = await tx.contentItem.create({
            data: {
              type: value.type,
              status: value.status,
              visibility: 'INSTITUTION_ONLY',
              ownerType: 'INSTITUTION',
              title: value.title,
              description: value.description ?? null,
              url: value.url ?? null,
              order: value.order,
              language: value.language,
              institutionId,
              boardId: parents.boardId,
              grade: parents.grade,
              subjectId: parents.subjectId,
              chapterId: parents.chapterId,
              topicId: parents.topicId,
              conceptId: parents.conceptId,
              createdById: user.sub,
              publishedAt: value.status === ContentStatus.PUBLISHED ? new Date() : null,
            },
          });
          await markRow(tx, row.id, ImportRowStatus.IMPORTED, [], created.id);
          imported++;
          continue;
        }

        if (job.entityType === 'QUESTIONS') {
          const value = check.value as QuestionParsedRow;
          const { parents, reason } = await this.resolveCurriculumCached(tx, cache, value);
          if (!parents) {
            const message = `Row ${row.rowNumber}: ${reason ?? 'curriculum references not found'}`;
            errors.push(message);
            await markRow(tx, row.id, ImportRowStatus.INVALID, [message]);
            continue;
          }
          const existing = await tx.question.findFirst({
            where: { institutionId, chapterId: parents.chapterId, text: value.text },
            select: { id: true },
          });
          if (existing) {
            duplicates++;
            await markRow(tx, row.id, ImportRowStatus.EXISTING, ['Record already exists']);
            continue;
          }
          const withOptions =
            value.type === QuestionType.MCQ || value.type === QuestionType.MULTI_SELECT;
          const created = await tx.question.create({
            data: {
              institutionId,
              boardId: parents.boardId,
              grade: parents.grade,
              subjectId: parents.subjectId,
              chapterId: parents.chapterId,
              topicId: parents.topicId,
              conceptId: parents.conceptId,
              type: value.type,
              status: value.status,
              source: 'IMPORT',
              difficulty: value.difficulty,
              marks: value.marks,
              text: value.text,
              hint: value.hint ?? null,
              explanation: value.explanation ?? null,
              answer: value.answer,
              language: value.language,
              createdById: user.sub,
              ...(withOptions
                ? {
                    options: {
                      create: value.options.map((option, index) => ({
                        text: option,
                        isCorrect: index === value.correctIndex,
                        order: index,
                      })),
                    },
                  }
                : {}),
            },
          });
          await markRow(tx, row.id, ImportRowStatus.IMPORTED, [], created.id);
          imported++;
          continue;
        }

        if (job.entityType === 'PARENTS') {
          const parentRow = check.value as ParentParsedRow;
          const parentEmail = parentRow.email.toLowerCase();
          const existingUser = await tx.user.findFirst({ where: { email: parentEmail }, select: { id: true } });
          const existingParent = await tx.parent.findFirst({
            where: { institutionId, email: { equals: parentEmail, mode: 'insensitive' } },
            select: { id: true },
          });
          if (existingUser || existingParent) {
            duplicates++;
            await markRow(tx, row.id, ImportRowStatus.EXISTING, ['Record already exists']);
            continue;
          }
          const studentId = parentRow.studentEmail
            ? await this.lookupStudent(tx, institutionId, parentRow.studentEmail, studentCache)
            : null;
          if (parentRow.studentEmail && !studentId) {
            const message = `Row ${row.rowNumber}: Student "${parentRow.studentEmail}" not found in this institution`;
            errors.push(message);
            await markRow(tx, row.id, ImportRowStatus.INVALID, [message]);
            continue;
          }
          const parent = await this.createParentRecord(tx, institutionId, parentRow, studentId);
          await markRow(tx, row.id, ImportRowStatus.IMPORTED, [], parent.id);
          imported++;
          continue;
        }

        const value = check.value as ParsedRow;
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
            await markRow(tx, row.id, ImportRowStatus.EXISTING, ['Record already exists']);
            continue;
          }
          const student = await this.createStudentRecord(tx, institutionId, academicYearId, value);
          await markRow(tx, row.id, ImportRowStatus.IMPORTED, [], student.id);
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
          await markRow(tx, row.id, ImportRowStatus.EXISTING, ['Record already exists']);
          continue;
        }
        const teacher = await this.createTeacherRecord(tx, institutionId, value);
        await markRow(tx, row.id, ImportRowStatus.IMPORTED, [], teacher.id);
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

    const auditAction: AuditAction =
      job.entityType === 'STUDENTS'
        ? 'STUDENT_IMPORTED'
        : job.entityType === 'TEACHERS'
          ? 'TEACHER_ADDED'
          : job.entityType === 'PARENTS'
            ? 'PARENT_CREATED'
            : job.entityType === 'CONTENT'
              ? 'CONTENT_CREATED'
              : 'QUESTION_GENERATED';

    await this.audit.log({
      userId: user.sub,
      institutionId,
      action: auditAction,
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

  private async createParentRecord(
    tx: Prisma.TransactionClient,
    institutionId: string,
    value: ParentParsedRow,
    studentId: string | null,
  ) {
    const email = value.email.toLowerCase();
    const passwordHash = await bcrypt.hash(value.phone ? value.phone.slice(-6) : 'sanro123', 10);
    const user = await tx.user.create({
      data: {
        name: value.name,
        email,
        phone: value.phone ?? null,
        passwordHash,
        isSuperAdmin: false,
      },
    });
    await tx.institutionMember.create({
      data: { institutionId, userId: user.id, role: 'PARENT', status: 'ACTIVE' },
    });
    const parent = await tx.parent.create({
      data: { institutionId, userId: user.id, name: user.name, email: user.email, phone: user.phone },
    });
    if (studentId) {
      const existingLink = await tx.parentStudentLink.findFirst({
        where: { parentId: parent.id, studentId },
        select: { id: true },
      });
      if (!existingLink) {
        await tx.parentStudentLink.create({ data: { parentId: parent.id, studentId } });
      }
    }
    return parent;
  }

  async history(user: RequestUser) {
    const institutionId = this.tenant.assertInstitutionAccess(user);
    return this.prisma.importJob.findMany({
      where: institutionId ? { institutionId } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { rows: true } },
      },
      take: 50,
    });
  }

  async jobDetail(user: RequestUser, jobId: string) {
    const institutionId = this.tenant.assertInstitutionAccess(user);
    const job = await this.prisma.importJob.findFirst({
      where: { id: jobId, ...(institutionId ? { institutionId } : {}) },
      include: {
        rows: { orderBy: { rowNumber: 'asc' }, take: 500 },
        createdBy: { select: { name: true } },
      },
    });
    if (!job) throw new NotFoundException('Import job not found');
    return job;
  }
}