import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditAction } from '@sanro/types';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit-notifications.service';
import { StorageService } from '../common/services/storage.service';
import { RequestUser } from '../common/types/auth-context';

interface CsvRow {
  type?: string;
  name?: string;
  code?: string;
  board?: string;
  grade?: string;
  subject?: string;
  chapter?: string;
  topic?: string;
  order?: string;
  description?: string;
  [key: string]: string | undefined;
}

export interface ParsedRow {
  rowNumber: number;
  status: 'VALID' | 'INVALID' | 'DUPLICATE' | 'EXISTING';
  errors: string[];
  entity: 'BOARD' | 'GRADE' | 'SUBJECT' | 'CHAPTER' | 'TOPIC' | 'CONCEPT';
  type?: string;
  name?: string;
  code?: string;
  board?: string;
  grade?: string;
  subject?: string;
  chapter?: string;
  topic?: string;
  order?: string;
  description?: string;
}

const NODE_KINDS = ['boards', 'grades', 'subjects', 'chapters', 'topics', 'concepts'] as const;
type NodeKind = (typeof NODE_KINDS)[number];

const NODE_MODEL: Record<NodeKind, { model: 'board' | 'grade' | 'subject' | 'chapter' | 'topic' | 'concept'; label: string }> = {
  boards: { model: 'board', label: 'Board' },
  grades: { model: 'grade', label: 'Grade' },
  subjects: { model: 'subject', label: 'Subject' },
  chapters: { model: 'chapter', label: 'Chapter' },
  topics: { model: 'topic', label: 'Topic' },
  concepts: { model: 'concept', label: 'Concept' },
};

interface ResolvedParents {
  board: { id: string } | null;
  grade: { id: string } | null;
  subject: { id: string } | null;
  chapter: { id: string } | null;
  topic: { id: string } | null;
}

@Injectable()
export class AdminCurriculumService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
  ) {}

  private requireSuperAdmin(user: RequestUser): void {
    if (user.role !== 'SUPER_ADMIN') throw new ForbiddenException('Only SUPER_ADMIN can manage the canonical curriculum');
  }

  async updateNode(user: RequestUser, kind: NodeKind, id: string, body: Record<string, unknown>) {
    this.requireSuperAdmin(user);
    const { model } = NODE_MODEL[kind];
    const existing = await (this.prisma as any)[model].findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`${NODE_MODEL[kind].label} not found`);

    const allowed: Record<string, (keyof Prisma.BoardUpdateInput | keyof Prisma.SubjectUpdateInput | keyof Prisma.ChapterUpdateInput | keyof Prisma.TopicUpdateInput | keyof Prisma.ConceptUpdateInput | keyof Prisma.GradeUpdateInput)[]> = {
      boards: ['name', 'active'],
      grades: ['name', 'order'],
      subjects: ['name', 'icon', 'color', 'order', 'description', 'active'],
      chapters: ['name', 'grade', 'order', 'description'],
      topics: ['name', 'order'],
      concepts: ['name', 'order', 'description'],
    };

    const data: Record<string, unknown> = {};
    for (const field of allowed[kind]) {
      if (field in body && body[field] !== undefined) data[field] = body[field];
    }
    if (Object.keys(data).length === 0) throw new BadRequestException('No updatable fields provided');

    const updated = await (this.prisma as any)[model].update({ where: { id }, data });

    await this.audit.log({
      userId: user.sub,
      action: AuditAction.CURRICULUM_UPDATED,
      entityType: kind.slice(0, -1).toUpperCase(),
      entityId: id,
      metadata: { fields: Object.keys(data), name: existing.name },
    });
    return updated;
  }

  async deleteNode(user: RequestUser, kind: NodeKind, id: string) {
    this.requireSuperAdmin(user);
    const { model } = NODE_MODEL[kind];
    const existing = await (this.prisma as any)[model].findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`${NODE_MODEL[kind].label} not found`);

    const childModel = kind === 'boards' ? 'grade' : kind === 'subjects' ? 'chapter' : kind === 'chapters' ? 'topic' : kind === 'topics' ? 'concept' : null;
    if (childModel) {
      const childCount = await (this.prisma as any)[childModel].count({ where: { [`${kind.slice(0, -1)}Id`]: id } });
      if (childCount > 0) throw new BadRequestException(`Cannot delete a ${NODE_MODEL[kind].label.toLowerCase()} that still has ${childCount} child ${childModel}(s)`);
    }

    await (this.prisma as any)[model].delete({ where: { id } });
    await this.audit.log({
      userId: user.sub,
      action: AuditAction.CURRICULUM_UPDATED,
      entityType: kind.slice(0, -1).toUpperCase(),
      entityId: id,
      metadata: { deleted: true, name: existing.name },
    });
    return { deleted: true, id };
  }

  // ---------- CSV/XLSX import ----------

  async previewImport(user: RequestUser, file: Express.Multer.File) {
    this.requireSuperAdmin(user);
    if (!file) throw new BadRequestException('File is required');
    if (file.size > 10 * 1024 * 1024) throw new BadRequestException('File exceeds 10MB limit');
    const ext = (file.originalname.split('.').pop() || '').toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) throw new BadRequestException('Only CSV/XLSX files are allowed');

    const parsed = await this.parseWorkbook(file.buffer);
    const summary = this.summarize(parsed);

    const key = `curriculum-import_${Date.now()}.${ext}`;
    await this.storage.upload('curriculum-import', key, file.buffer, file.mimetype || 'application/octet-stream');

    await this.audit.log({
      userId: user.sub,
      action: AuditAction.CURRICULUM_IMPORTED,
      entityType: 'CURRICULUM_IMPORT',
      metadata: { fileName: file.originalname, ...summary },
    });

    return { jobId: key, fileName: file.originalname, summary, previewRows: parsed.slice(0, 100) };
  }

  async importDetail(user: RequestUser, jobId: string) {
    this.requireSuperAdmin(user);
    const parts = jobId.split('/');
    const filename = parts[parts.length - 1];
    if (!filename) throw new NotFoundException('Import not found');
    const buffer = await this.storage.read('curriculum-import', filename);
    const parsed = await this.parseWorkbook(buffer);
    const summary = this.summarize(parsed);
    return { jobId, summary, previewRows: parsed.slice(0, 100) };
  }

  async commitImport(user: RequestUser, jobId: string) {
    this.requireSuperAdmin(user);
    const parts = jobId.split('/');
    const filename = parts[parts.length - 1];
    if (!filename) throw new NotFoundException('Import not found');
    const buffer = await this.storage.read('curriculum-import', filename);
    const parsed = await this.parseWorkbook(buffer);

    const counts = { created: 0, updated: 0, skipped: 0 };
    for (const row of parsed) {
      if (row.status !== 'VALID') {
        counts.skipped++;
        continue;
      }
      const action = await this.upsertRow(row);
      if (action === 'created') counts.created++;
      else counts.updated++;
    }

    const summary = this.summarize(parsed);
    await this.audit.log({
      userId: user.sub,
      action: AuditAction.CURRICULUM_IMPORTED,
      entityType: 'CURRICULUM_IMPORT',
      metadata: { committed: true, counts, summary },
    });
    return { committed: counts, summary };
  }

  private summarize(rows: ParsedRow[]) {
    return {
      totalRows: rows.length,
      validRows: rows.filter((r) => r.status === 'VALID').length,
      invalidRows: rows.filter((r) => r.status === 'INVALID').length,
      duplicateRows: rows.filter((r) => r.status === 'DUPLICATE').length,
      existingRows: rows.filter((r) => r.status === 'EXISTING').length,
    };
  }

  private async parseWorkbook(buffer: Buffer): Promise<ParsedRow[]> {
    let rows: CsvRow[];
    try {
      const XLSX = require('xlsx');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as CsvRow[];
    } catch (err) {
      throw new BadRequestException(`Unable to parse file: ${(err as Error).message}`);
    }
    if (!rows || rows.length === 0) throw new BadRequestException('File contained no data rows');

    const normalized = rows
      .map((r) => {
        const out: CsvRow = {};
        for (const k of Object.keys(r)) {
          const key = k.trim().toLowerCase().replace(/\s+/g, '_');
          out[key] = (r[k] ?? '').toString().trim();
        }
        return out;
      })
      .filter((r) => Boolean(r.type || r.name));

    return this.validateRows(normalized);
  }

  private async resolveParents(row: Pick<CsvRow, 'board' | 'grade' | 'subject' | 'chapter' | 'topic'>): Promise<ResolvedParents> {
    const board = row.board ? await this.findBoard(row.board) : null;
    let grade: { id: string } | null = null;
    let subject: { id: string } | null = null;
    let chapter: { id: string } | null = null;
    let topic: { id: string } | null = null;

    if (board && row.grade) {
      grade = await this.prisma.grade.findFirst({ where: { boardId: board.id, name: row.grade } });
    }
    if (board && row.subject) {
      subject = await this.prisma.subject.findFirst({
        where: { boardId: board.id, OR: [{ code: row.subject.toUpperCase() }, { name: row.subject }] },
      });
    }
    if (subject && row.chapter) {
      const uppercaseCode = row.chapter.toUpperCase();
      chapter = await this.prisma.chapter.findFirst({
        where: { subjectId: subject.id, OR: [{ code: uppercaseCode }, { name: row.chapter }] },
      });
    }
    if (chapter && row.topic) {
      topic = await this.prisma.topic.findFirst({ where: { chapterId: chapter.id, name: row.topic } });
    }
    return { board, grade, subject, chapter, topic };
  }

  private async validateRows(rows: CsvRow[]): Promise<ParsedRow[]> {
    const out: ParsedRow[] = [];
    let i = 0;
    for (const row of rows) {
      i++;
      const type = (row.type || '').toUpperCase();
      const errors: string[] = [];
      const base: ParsedRow = { ...row, rowNumber: i + 1, status: 'VALID', errors, entity: type as ParsedRow['entity'] };

      if (!['BOARD', 'GRADE', 'SUBJECT', 'CHAPTER', 'TOPIC', 'CONCEPT'].includes(type)) {
        errors.push(`Unknown type "${type}"`);
        base.status = 'INVALID';
        out.push(base);
        continue;
      }

      const parents = await this.resolveParents(row);

      switch (type) {
        case 'BOARD':
          if (!row.name) errors.push('name is required');
          if (!row.code) errors.push('code is required');
          break;
        case 'GRADE':
          if (!parents.board) errors.push(`Board "${row.board}" not found`);
          if (!row.name) errors.push('name is required');
          break;
        case 'SUBJECT':
          if (!parents.board) errors.push(`Board "${row.board}" not found`);
          if (!row.code) errors.push('code is required');
          if (!row.name) errors.push('name is required');
          break;
        case 'CHAPTER':
          if (!parents.subject) errors.push(`Subject "${row.subject}" not found`);
          if (!row.code) errors.push('code is required');
          if (!row.name) errors.push('name is required');
          if (!row.grade) errors.push('grade is required');
          break;
        case 'TOPIC':
          if (!parents.chapter) errors.push(`Chapter "${row.chapter}" not found`);
          if (!row.name) errors.push('name is required');
          break;
        case 'CONCEPT':
          if (!parents.topic) errors.push(`Topic "${row.topic}" not found`);
          if (!row.name) errors.push('name is required');
          break;
      }

      if (errors.length > 0) {
        base.status = 'INVALID';
        out.push(base);
        continue;
      }

      if (await this.findExisting(type, row, parents)) {
        base.status = 'EXISTING';
      }
      out.push(base);
    }
    return out;
  }

  private async findExisting(type: string, row: Pick<CsvRow, 'name' | 'code'>, parents: ResolvedParents): Promise<boolean> {
    switch (type) {
      case 'BOARD':
        return Boolean(await this.findBoard(row.name ?? ''));
      case 'GRADE':
        return Boolean(parents.board && (await this.prisma.grade.findFirst({ where: { boardId: parents.board.id, name: row.name } })));
      case 'SUBJECT':
        return Boolean(parents.board && (await this.prisma.subject.findFirst({ where: { boardId: parents.board.id, code: (row.code ?? '').toUpperCase() } })));
      case 'CHAPTER':
        return Boolean(parents.subject && (await this.prisma.chapter.findFirst({ where: { subjectId: parents.subject.id, code: (row.code ?? '').toUpperCase() } })));
      case 'TOPIC':
        return Boolean(parents.chapter && (await this.prisma.topic.findFirst({ where: { chapterId: parents.chapter.id, name: row.name } })));
      case 'CONCEPT':
        return Boolean(parents.topic && (await this.prisma.concept.findFirst({ where: { topicId: parents.topic.id, name: row.name } })));
      default:
        return false;
    }
  }

  private async findBoard(ref: string): Promise<{ id: string } | null> {
    const trimmed = (ref || '').trim();
    if (!trimmed) return null;
    return this.prisma.board.findFirst({ where: { OR: [{ code: trimmed.toUpperCase() }, { name: trimmed }] }, select: { id: true } });
  }

  private async upsertRow(row: ParsedRow): Promise<'created' | 'updated'> {
    const type = row.entity;
    if (type === 'BOARD') {
      const existing = await this.findBoard(row.name ?? '');
      if (existing) {
        await this.prisma.board.update({ where: { id: existing.id }, data: { name: row.name, code: (row.code ?? '').toUpperCase() } });
        return 'updated';
      }
      await this.prisma.board.create({ data: { name: row.name!, code: (row.code ?? '').toUpperCase().replace(/\s+/g, '_') } });
      return 'created';
    }

    const parents = await this.resolveParents(row);
    switch (type) {
      case 'GRADE': {
        if (!parents.board) break;
        const existing = await this.prisma.grade.findFirst({ where: { boardId: parents.board.id, name: row.name } });
        if (existing) {
          await this.prisma.grade.update({ where: { id: existing.id }, data: { order: Number(row.order ?? 0) } });
          return 'updated';
        }
        await this.prisma.grade.create({ data: { boardId: parents.board.id, name: row.name!, order: Number(row.order ?? 0) } });
        return 'created';
      }
      case 'SUBJECT': {
        if (!parents.board) break;
        const code = (row.code ?? '').toUpperCase();
        const existing = await this.prisma.subject.findFirst({ where: { boardId: parents.board.id, code } });
        if (existing) {
          await this.prisma.subject.update({ where: { id: existing.id }, data: { name: row.name, order: Number(row.order ?? 0), description: row.description ?? undefined } });
          return 'updated';
        }
        await this.prisma.subject.create({ data: { boardId: parents.board.id, name: row.name!, code, order: Number(row.order ?? 0), description: row.description ?? undefined } });
        return 'created';
      }
      case 'CHAPTER': {
        if (!parents.subject) break;
        const code = (row.code ?? '').toUpperCase();
        const existing = await this.prisma.chapter.findFirst({ where: { subjectId: parents.subject.id, code } });
        if (existing) {
          await this.prisma.chapter.update({ where: { id: existing.id }, data: { name: row.name, grade: row.grade, order: Number(row.order ?? 0), description: row.description ?? undefined } });
          return 'updated';
        }
        await this.prisma.chapter.create({ data: { subjectId: parents.subject.id, name: row.name!, code, grade: row.grade!, order: Number(row.order ?? 0), description: row.description ?? undefined } });
        return 'created';
      }
      case 'TOPIC': {
        if (!parents.chapter) break;
        const existing = await this.prisma.topic.findFirst({ where: { chapterId: parents.chapter.id, name: row.name } });
        if (existing) {
          await this.prisma.topic.update({ where: { id: existing.id }, data: { order: Number(row.order ?? 0) } });
          return 'updated';
        }
        await this.prisma.topic.create({ data: { chapterId: parents.chapter.id, name: row.name!, order: Number(row.order ?? 0) } });
        return 'created';
      }
      case 'CONCEPT': {
        if (!parents.topic) break;
        const existing = await this.prisma.concept.findFirst({ where: { topicId: parents.topic.id, name: row.name } });
        if (existing) {
          await this.prisma.concept.update({ where: { id: existing.id }, data: { order: Number(row.order ?? 0), description: row.description ?? undefined } });
          return 'updated';
        }
        await this.prisma.concept.create({ data: { topicId: parents.topic.id, name: row.name!, order: Number(row.order ?? 0), description: row.description ?? undefined } });
        return 'created';
      }
      default:
        throw new BadRequestException(`Unhandled row type ${type}`);
    }
    throw new BadRequestException(`Row could not be resolved for type ${type}`);
  }

  // ---------- Institution curriculum access ----------

  async listAccess(user: RequestUser, institutionId?: string) {
    this.requireSuperAdmin(user);
    return this.prisma.institutionCurriculumAccess.findMany({
      where: institutionId ? { institutionId } : {},
      include: {
        institution: { select: { id: true, name: true, code: true } },
        board: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async grantAccess(user: RequestUser, data: { institutionId: string; boardId: string; grade?: string; subjectId?: string }) {
    this.requireSuperAdmin(user);
    const institution = await this.prisma.institution.findUnique({ where: { id: data.institutionId } });
    if (!institution) throw new NotFoundException('Institution not found');
    const board = await this.prisma.board.findUnique({ where: { id: data.boardId } });
    if (!board) throw new NotFoundException('Board not found');
    if (data.subjectId) {
      const subject = await this.prisma.subject.findUnique({ where: { id: data.subjectId } });
      if (!subject || subject.boardId !== data.boardId) throw new BadRequestException('Subject must belong to the given board');
    }

    const accessWhere: Prisma.InstitutionCurriculumAccessWhereInput = {
        institutionId: data.institutionId,
        boardId: data.boardId,
        grade: data.grade ?? null,
        subjectId: data.subjectId ?? null,
      };

    const existing = await this.prisma.institutionCurriculumAccess.findFirst({ where: accessWhere });
    if (existing) return existing;

    const access = await this.prisma.institutionCurriculumAccess.create({
      data: {
        institutionId: data.institutionId,
        boardId: data.boardId,
        grade: data.grade ?? null,
        subjectId: data.subjectId ?? null,
        grantedById: user.sub,
      },
    });

    await this.audit.log({
      userId: user.sub,
      institutionId: data.institutionId,
      action: AuditAction.CURRICULUM_ASSIGNED,
      entityType: 'CURRICULUM_ACCESS',
      entityId: access.id,
      metadata: { boardId: data.boardId, grade: data.grade ?? null, subjectId: data.subjectId ?? null },
    });
    return access;
  }

  async revokeAccess(user: RequestUser, id: string) {
    this.requireSuperAdmin(user);
    const access = await this.prisma.institutionCurriculumAccess.findUnique({ where: { id } });
    if (!access) throw new NotFoundException('Access not found');
    await this.prisma.institutionCurriculumAccess.delete({ where: { id } });
    await this.audit.log({
      userId: user.sub,
      institutionId: access.institutionId,
      action: AuditAction.CURRICULUM_UNASSIGNED,
      entityType: 'CURRICULUM_ACCESS',
      entityId: id,
      metadata: { boardId: access.boardId },
    });
    return { deleted: true };
  }
}