import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';
import { StudentIdentityService } from '../common/services/student-identity.service';
import { StorageService } from '../common/services/storage.service';
import { RequestUser } from '../common/types/auth-context';
import { ArValidationService } from './ar-validation.service';

const AR_ACTIVITY_TYPES = [
  'AR_OPENED',
  'AR_STARTED',
  'AR_MODEL_INTERACTION',
  'AR_QUICK_CHECK_STARTED',
  'AR_QUICK_CHECK_COMPLETED',
  'AR_COMPLETED',
] as const;

const MANAGED_STATUSES = ['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED'] as const;

const TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['REVIEW', 'ARCHIVED'],
  REVIEW: ['APPROVED', 'DRAFT', 'ARCHIVED'],
  APPROVED: ['PUBLISHED', 'REVIEW', 'ARCHIVED'],
  PUBLISHED: ['ARCHIVED', 'APPROVED'],
  ARCHIVED: ['DRAFT'],
};

const STUDENT_READ_SELECT = {
  id: true,
  title: true,
  description: true,
  learningObjective: true,
  instructions: true,
  difficulty: true,
  modelFormat: true,
  modelKey: true,
  modelUrl: true,
  previewKey: true,
  previewUrl: true,
  thumbnailUrl: true,
  hotspots: true,
  validationStatus: true,
  source: true,
  license: true,
  attribution: true,
  version: true,
  conceptId: true,
  chapterId: true,
  subjectId: true,
  grade: true,
  publishedAt: true,
  status: true,
  visibility: true,
  institutionId: true,
} as const;

@Injectable()
export class ArService {
  private readonly logger = new Logger(ArService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
    private readonly identity: StudentIdentityService,
    private readonly storage: StorageService,
    private readonly validation: ArValidationService,
  ) {}

  // ==========================================================================
  // Student / teacher reads
  // ==========================================================================

  async listForConcept(user: RequestUser, conceptId: string) {
    const grade = await this.studentGrade(user);
    const where: any = {
      conceptId,
      status: 'PUBLISHED',
      OR: [
        { visibility: 'PUBLIC' },
        { visibility: 'INSTITUTION_ONLY', institutionId: user.institutionId ?? '__none__' },
      ],
    };
    if (grade) where.AND = [{ OR: [{ grade: null }, { grade }] }];

    const items = await this.prisma.arContent.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { title: 'asc' }],
      select: STUDENT_READ_SELECT,
    });
    return items.map((item) => this.toCard(item));
  }

  async listForStudent(user: RequestUser, filters: { subjectId?: string; conceptId?: string; chapterId?: string } = {}) {
    const grade = await this.studentGrade(user);
    const where: any = {
      status: 'PUBLISHED',
      OR: [
        { visibility: 'PUBLIC' },
        { visibility: 'INSTITUTION_ONLY', institutionId: user.institutionId ?? '__none__' },
      ],
    };
    if (filters.subjectId) where.subjectId = filters.subjectId;
    if (filters.chapterId) where.chapterId = filters.chapterId;
    if (filters.conceptId) where.conceptId = filters.conceptId;
    if (grade) where.AND = [{ OR: [{ grade: null }, { grade }] }];

    const items = await this.prisma.arContent.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }],
      take: 50,
      select: STUDENT_READ_SELECT,
    });
    return items.map((item) => this.toCard(item));
  }

  async listForTeacher(
    user: RequestUser,
    filters: { subjectId?: string; chapterId?: string; conceptId?: string } = {},
  ) {
    if (!user.institutionId) throw new ForbiddenException('No institution context');
    const where: any = {
      status: 'PUBLISHED',
      OR: [
        { visibility: 'PUBLIC' },
        { visibility: 'INSTITUTION_ONLY', institutionId: user.institutionId },
      ],
    };
    if (filters.subjectId) where.subjectId = filters.subjectId;
    if (filters.chapterId) where.chapterId = filters.chapterId;
    if (filters.conceptId) where.conceptId = filters.conceptId;

    const items = await this.prisma.arContent.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }],
      take: 100,
      select: STUDENT_READ_SELECT,
    });
    return items.map((item) => this.toCard(item));
  }

  async getDetail(user: RequestUser, id: string) {
    const item = await this.findReadable(user, id);
    return this.toCard(item);
  }

  async getModelUrl(user: RequestUser, id: string) {
    const item = await this.findReadable(user, id, true);
    return this.resolveModelUrl(item);
  }

  private async resolveModelUrl(item: { modelKey: string | null; modelUrl: string | null; modelFormat: string | null }) {
    if (item.modelKey) {
      const url = await this.storage.getSignedUrl(item.modelKey, 1800);
      return { url, format: item.modelFormat, expiresIn: 1800, source: 'storage' as const };
    }
    if (item.modelUrl) {
      return { url: item.modelUrl, format: item.modelFormat, expiresIn: null, source: 'external' as const };
    }
    throw new NotFoundException('No 3D model is available for this content');
  }

  async getQuickCheck(user: RequestUser, id: string) {
    const item = (await this.findReadable(user, id)) as any;
    if (!item.conceptId) return { arContentId: id, conceptId: null, questions: [] };

    const questions = await this.prisma.question.findMany({
      where: {
        conceptId: item.conceptId,
        status: 'APPROVED',
        OR: [{ institutionId: null }, { institutionId: user.institutionId ?? '__none__' }],
        ...(item.grade ? { grade: item.grade } : {}),
      },
      orderBy: { id: 'asc' },
      take: 5,
      select: {
        id: true,
        text: true,
        type: true,
        difficulty: true,
        marks: true,
        options: { select: { id: true, text: true, order: true }, orderBy: { order: 'asc' } },
      },
    });
    return { arContentId: id, conceptId: item.conceptId, questions };
  }

  async submitQuickCheck(
    user: RequestUser,
    id: string,
    answers: Array<{ questionId: string; optionId?: string; answer?: string }>,
  ) {
    const item = (await this.findReadable(user, id)) as any;
    const questionIds = Array.isArray(answers) ? answers.map((a) => a.questionId).slice(0, 20) : [];
    if (questionIds.length === 0) throw new BadRequestException('No answers submitted');

    const questions = await this.prisma.question.findMany({
      where: {
        id: { in: questionIds },
        conceptId: item.conceptId ?? undefined,
        status: 'APPROVED',
        OR: [{ institutionId: null }, { institutionId: user.institutionId ?? '__none__' }],
      },
      select: {
        id: true,
        answer: true,
        explanation: true,
        type: true,
        options: { select: { id: true, text: true, isCorrect: true } },
      },
    });

    const byId = new Map(questions.map((q) => [q.id, q]));
    let score = 0;
    const results = answers.map((submitted) => {
      const question = byId.get(submitted.questionId);
      if (!question) {
        return { questionId: submitted.questionId, correct: false, correctAnswer: null, explanation: null };
      }
      const correctOption = question.options.find((o) => o.isCorrect);
      let correct = false;
      if (submitted.optionId) {
        correct = correctOption?.id === submitted.optionId;
      } else if (typeof submitted.answer === 'string') {
        correct =
          submitted.answer.trim().toLowerCase() === (question.answer ?? '').trim().toLowerCase();
      }
      if (correct) score += 1;
      return {
        questionId: question.id,
        correct,
        correctAnswer: correctOption?.text ?? question.answer ?? null,
        explanation: question.explanation ?? null,
      };
    });

    await this.recordActivity(user, id, {
      type: 'AR_QUICK_CHECK_COMPLETED',
      metadata: { score, total: results.length },
    });

    return { arContentId: id, score, total: results.length, results };
  }

  async recordActivity(
    user: RequestUser,
    id: string,
    body: { type: string; sessionId?: string; metadata?: Record<string, unknown> },
  ) {
    const type = AR_ACTIVITY_TYPES.includes(body?.type as (typeof AR_ACTIVITY_TYPES)[number])
      ? (body.type as (typeof AR_ACTIVITY_TYPES)[number])
      : null;
    if (!type) throw new BadRequestException('Invalid AR activity type');

    const item = await this.prisma.arContent.findUnique({
      where: { id },
      select: { id: true, conceptId: true, institutionId: true, status: true, visibility: true, grade: true },
    });
    if (!item) throw new NotFoundException('AR content not found');
    this.assertReadable(user, item);

    const student = user.role === 'STUDENT' ? await this.identity.resolveForUser(user) : null;
    const metadata =
      body.metadata && JSON.stringify(body.metadata).length <= 4096 ? body.metadata : undefined;

    await this.prisma.arActivity.create({
      data: {
        type,
        arContentId: item.id,
        conceptId: item.conceptId ?? null,
        studentId: student?.id ?? null,
        institutionId: user.institutionId ?? item.institutionId ?? null,
        sessionId: body.sessionId ?? null,
        metadata: (metadata as object) ?? undefined,
      },
    });
    return { ok: true };
  }

  // ==========================================================================
  // Admin management
  // ==========================================================================

  async adminList(
    user: RequestUser,
    filters: { status?: string; conceptId?: string; subjectId?: string; search?: string } = {},
  ) {
    await this.assertManager(user);
    const scope = this.adminScope(user);
    const where: any = { ...scope };
    if (filters.status && MANAGED_STATUSES.includes(filters.status as (typeof MANAGED_STATUSES)[number])) {
      where.status = filters.status;
    }
    if (filters.conceptId) where.conceptId = filters.conceptId;
    if (filters.subjectId) where.subjectId = filters.subjectId;
    if (filters.search) where.title = { contains: filters.search, mode: 'insensitive' };

    return this.prisma.arContent.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
  }

  async adminDetail(user: RequestUser, id: string) {
    const item = await this.findManageable(user, id);
    const [versions, activityCounts] = await Promise.all([
      this.prisma.arContentVersion.findMany({
        where: { arContentId: id },
        orderBy: { version: 'desc' },
        take: 20,
      }),
      this.prisma.arActivity.groupBy({
        by: ['type'],
        where: { arContentId: id },
        _count: true,
      }),
    ]);
    return {
      ...item,
      versions,
      activity: Object.fromEntries(activityCounts.map((a) => [a.type, a._count])),
    };
  }

  async adminCreate(
    user: RequestUser,
    dto: {
      title: string;
      description?: string;
      learningObjective?: string;
      instructions?: string;
      difficulty?: string;
      visibility?: string;
      boardId?: string;
      subjectId?: string;
      chapterId?: string;
      topicId?: string;
      conceptId?: string;
      grade?: string;
      hotspots?: unknown;
      source?: string;
      license?: string;
      attribution?: string;
      institutionId?: string;
    },
  ) {
    await this.assertManager(user);
    if (!dto?.title?.trim()) throw new BadRequestException('Title is required');

    const mapping = await this.resolveMapping({
      chapterId: dto.chapterId,
      conceptId: dto.conceptId,
      grade: dto.grade,
      subjectId: dto.subjectId,
    });

    const institutionId =
      user.role === 'SUPER_ADMIN' ? dto.institutionId ?? null : this.tenant.requireInstitution(user);

    return this.prisma.arContent.create({
      data: {
        title: dto.title.trim(),
        description: dto.description ?? null,
        learningObjective: dto.learningObjective ?? null,
        instructions: dto.instructions ?? null,
        difficulty: this.difficulty(dto.difficulty),
        visibility: user.role === 'SUPER_ADMIN' ? this.visibility(dto.visibility ?? 'PUBLIC') : this.visibility(dto.visibility ?? 'INSTITUTION_ONLY'),
        boardId: dto.boardId ?? null,
        subjectId: mapping.subjectId ?? dto.subjectId ?? null,
        chapterId: dto.chapterId ?? null,
        topicId: dto.topicId ?? null,
        conceptId: dto.conceptId ?? null,
        grade: mapping.grade ?? dto.grade ?? null,
        hotspots: (dto.hotspots as object) ?? undefined,
        source: dto.source ?? null,
        license: dto.license ?? null,
        attribution: dto.attribution ?? null,
        institutionId,
        createdById: user.sub,
        status: 'DRAFT',
        validationStatus: 'PENDING',
      },
    });
  }

  async adminUpdate(user: RequestUser, id: string, dto: Record<string, any>) {
    const item = await this.findManageable(user, id);
    const data: Record<string, unknown> = {};

    const stringFields = [
      'title',
      'description',
      'learningObjective',
      'instructions',
      'source',
      'license',
      'attribution',
      'boardId',
      'subjectId',
      'chapterId',
      'topicId',
      'conceptId',
      'grade',
      'thumbnailUrl',
    ];
    for (const field of stringFields) {
      if (dto[field] !== undefined) data[field] = dto[field] === '' ? null : dto[field];
    }
    if (dto.difficulty !== undefined) data.difficulty = this.difficulty(dto.difficulty);
    if (dto.visibility !== undefined && user.role === 'SUPER_ADMIN') {
      data.visibility = this.visibility(dto.visibility);
    }
    if (dto.hotspots !== undefined) data.hotspots = dto.hotspots;

    if (dto.chapterId !== undefined || dto.conceptId !== undefined || dto.grade !== undefined) {
      const mapping = await this.resolveMapping({
        chapterId: (dto.chapterId ?? item.chapterId) as string | undefined,
        conceptId: (dto.conceptId ?? item.conceptId) as string | undefined,
        grade: (dto.grade ?? item.grade) as string | undefined,
        subjectId: (dto.subjectId ?? item.subjectId) as string | undefined,
      });
      if (mapping.grade) data.grade = mapping.grade;
      if (mapping.subjectId) data.subjectId = mapping.subjectId;
    }

    if (Object.keys(data).length === 0) return item;
    return this.prisma.arContent.update({ where: { id }, data });
  }

  async adminUploadModel(user: RequestUser, id: string, file: Express.Multer.File) {
    const item = await this.findManageable(user, id);
    this.assertFile(file);
    const sanitized = this.validation.sanitizeModelUpload(file.originalname);

    const result = this.validation.validateModel(file.originalname, sanitized.format, file.buffer);
    if (result.status === 'INVALID') {
      throw new BadRequestException({
        message: 'Model failed validation and was not stored',
        validation: result,
      });
    }

    const stored = await this.storage.upload(
      'ar/models',
      sanitized.filename,
      file.buffer,
      this.modelMime(sanitized.extension),
    );

    await this.snapshot(item, user, 'model upload');

    return this.prisma.arContent.update({
      where: { id },
      data: {
        modelKey: stored.key,
        modelUrl: stored.provider === 'local' ? stored.url : stored.url,
        modelFormat: sanitized.format,
        fileSizeBytes: file.size,
        polygonCount: result.polygonCount ?? null,
        validationStatus: result.status,
        validationReport: { checks: result.checks, warnings: result.warnings, errors: result.errors } as object,
        version: item.version + 1,
      },
    });
  }

  async adminUploadPreview(user: RequestUser, id: string, file: Express.Multer.File) {
    await this.findManageable(user, id);
    this.assertFile(file);
    const sanitized = this.validation.sanitizeImageUpload(file.originalname);
    this.validation.assertImageMime(file.mimetype);
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Preview image exceeds 5MB');
    }
    const stored = await this.storage.upload('ar/previews', sanitized.filename, file.buffer, file.mimetype);
    return this.prisma.arContent.update({
      where: { id },
      data: { previewKey: stored.key, previewUrl: stored.url, thumbnailUrl: stored.url },
    });
  }

  async adminTransition(user: RequestUser, id: string, status: string) {
    const item = await this.findManageable(user, id);
    const next = (status || '').toUpperCase();
    if (!MANAGED_STATUSES.includes(next as (typeof MANAGED_STATUSES)[number])) {
      throw new BadRequestException(`Unknown status "${status}"`);
    }
    if (next === item.status) return item;
    if (!TRANSITIONS[item.status]?.includes(next)) {
      throw new BadRequestException(`Cannot transition from ${item.status} to ${next}`);
    }

    const data: Record<string, unknown> = { status: next };

    if (next === 'APPROVED') {
      data.reviewedById = user.sub;
    }

    if (next === 'PUBLISHED') {
      const blockers: string[] = [];
      if (!item.modelKey && !item.modelUrl) blockers.push('a 3D model');
      if (!item.conceptId) blockers.push('a concept mapping');
      if (!item.previewUrl && !item.thumbnailUrl) blockers.push('a preview image');
      if (item.validationStatus === 'INVALID') blockers.push('a valid model (validation failed)');
      if (item.validationStatus === 'INCOMPLETE' && !item.reviewedById) {
        blockers.push('manual review (validation incomplete)');
      }
      if (item.validationStatus === 'PENDING') blockers.push('model validation');
      if (blockers.length > 0) {
        throw new BadRequestException(`Cannot publish: missing ${blockers.join(', ')}`);
      }
      await this.snapshot(item, user, 'publish');
      data.publishedAt = new Date();
      data.version = item.version + 1;
    }

    return this.prisma.arContent.update({ where: { id }, data });
  }

  async adminReplaceModel(user: RequestUser, id: string, file: Express.Multer.File) {
    const item = await this.findManageable(user, id);
    this.assertFile(file);
    const sanitized = this.validation.sanitizeModelUpload(file.originalname);
    const result = this.validation.validateModel(file.originalname, sanitized.format, file.buffer);
    if (result.status === 'INVALID') {
      throw new BadRequestException({ message: 'Replacement model failed validation', validation: result });
    }
    await this.snapshot(item, user, 'replace');

    const stored = await this.storage.upload(
      'ar/models',
      sanitized.filename,
      file.buffer,
      this.modelMime(sanitized.extension),
    );
    if (item.modelKey && item.modelKey !== stored.key) {
      const [category, ...rest] = item.modelKey.split('/');
      await this.storage.delete(category, rest.join('/')).catch(() => undefined);
    }

    return this.prisma.arContent.update({
      where: { id },
      data: {
        modelKey: stored.key,
        modelUrl: stored.url,
        modelFormat: sanitized.format,
        fileSizeBytes: file.size,
        polygonCount: result.polygonCount ?? null,
        validationStatus: result.status,
        validationReport: { checks: result.checks, warnings: result.warnings, errors: result.errors } as object,
        version: item.version + 1,
        status: item.status === 'PUBLISHED' ? 'REVIEW' : item.status,
      },
    });
  }

  async adminVersions(user: RequestUser, id: string) {
    await this.findManageable(user, id);
    return this.prisma.arContentVersion.findMany({
      where: { arContentId: id },
      orderBy: { version: 'desc' },
      take: 50,
    });
  }

  async adminDelete(user: RequestUser, id: string) {
    const item = await this.findManageable(user, id);
    for (const key of [item.modelKey, item.previewKey]) {
      if (!key) continue;
      const [category, ...rest] = key.split('/');
      await this.storage.delete(category, rest.join('/')).catch(() => undefined);
    }
    await this.prisma.arContentVersion.deleteMany({ where: { arContentId: id } });
    await this.prisma.arContent.delete({ where: { id } });
    return { ok: true, deleted: id };
  }

  async institutionUsage(user: RequestUser, institutionId?: string) {
    const scope = this.adminScope(user, institutionId);
    const [byStatus, byDifficulty, topConcepts, activityByType, total] = await Promise.all([
      this.prisma.arContent.groupBy({ by: ['status'], where: scope, _count: true }),
      this.prisma.arContent.groupBy({ by: ['difficulty'], where: scope, _count: true }),
      this.prisma.arContent.groupBy({
        by: ['conceptId'],
        where: { ...scope, status: 'PUBLISHED' },
        _count: true,
        orderBy: { _count: { conceptId: 'desc' } },
        take: 10,
      }),
      this.prisma.arActivity.groupBy({
        by: ['type'],
        where: scope.institutionId ? { institutionId: scope.institutionId } : {},
        _count: true,
      }),
      this.prisma.arContent.count({ where: scope }),
    ]);

    const conceptIds = topConcepts.map((c) => c.conceptId).filter(Boolean) as string[];
    const concepts = conceptIds.length
      ? await this.prisma.concept.findMany({ where: { id: { in: conceptIds } }, select: { id: true, name: true } })
      : [];
    const nameById = new Map(concepts.map((c) => [c.id, c.name]));

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      byDifficulty: Object.fromEntries(byDifficulty.map((d) => [d.difficulty, d._count])),
      activityByType: Object.fromEntries(activityByType.map((a) => [a.type, a._count])),
      topConcepts: topConcepts.map((c) => ({
        conceptId: c.conceptId,
        conceptName: c.conceptId ? nameById.get(c.conceptId) ?? 'Unknown' : 'Unmapped',
        count: c._count,
      })),
    };
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  private toCard(item: any) {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      learningObjective: item.learningObjective,
      instructions: item.instructions,
      difficulty: item.difficulty,
      modelFormat: item.modelFormat,
      hasModel: Boolean(item.modelKey || item.modelUrl),
      previewUrl: item.previewUrl ?? item.thumbnailUrl ?? null,
      hotspots: item.hotspots ?? null,
      validationStatus: item.validationStatus,
      source: item.source,
      license: item.license,
      attribution: item.attribution,
      version: item.version,
      conceptId: item.conceptId,
      chapterId: item.chapterId,
      subjectId: item.subjectId,
      grade: item.grade,
      publishedAt: item.publishedAt,
    };
  }

  private async findReadable(user: RequestUser, id: string, allowUnpublishedStaff = false) {
    const item = await this.prisma.arContent.findUnique({
      where: { id },
      select: STUDENT_READ_SELECT,
    });
    if (!item) throw new NotFoundException('AR content not found');

    if (allowUnpublishedStaff && user.role !== 'STUDENT' && user.role !== 'PARENT') {
      if (user.role === 'SUPER_ADMIN') return item;
      if (user.role === 'INSTITUTION_ADMIN' || user.role === 'TEACHER') {
        if (item.visibility === 'PRIVATE' && item.institutionId !== user.institutionId) {
          throw new NotFoundException('AR content not found');
        }
        if (item.institutionId && item.institutionId !== user.institutionId) {
          throw new NotFoundException('AR content not found');
        }
        return item;
      }
    }

    this.assertReadable(user, item);
    if (user.role === 'STUDENT' && item.grade) {
      const student = await this.identity.resolveForUser(user);
      if (student?.grade && student.grade !== item.grade) {
        throw new NotFoundException('AR content not found');
      }
    }
    return item;
  }

  private assertReadable(
    user: RequestUser,
    item: { status: string; visibility: string; institutionId: string | null },
  ) {
    if (item.status !== 'PUBLISHED') throw new NotFoundException('AR content not found');
    if (item.visibility === 'PRIVATE') {
      throw new NotFoundException('AR content not found');
    }
    if (item.visibility === 'INSTITUTION_ONLY' && item.institutionId && item.institutionId !== user.institutionId) {
      throw new NotFoundException('AR content not found');
    }
  }

  private async findManageable(user: RequestUser, id: string) {
    await this.assertManager(user);
    const item = await this.prisma.arContent.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('AR content not found');
    if (!this.canManage(user, item)) {
      throw new ForbiddenException('Access to another institution is forbidden');
    }
    return item;
  }

  private async assertManager(user: RequestUser) {
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'INSTITUTION_ADMIN') {
      throw new ForbiddenException('Only admins can manage AR content');
    }
  }

  private canManage(user: RequestUser, item: { institutionId: string | null }) {
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.role !== 'INSTITUTION_ADMIN') return false;
    if (!user.institutionId) return false;
    return item.institutionId === null || item.institutionId === user.institutionId;
  }

  private adminScope(user: RequestUser, requestedInstitutionId?: string) {
    if (user.role === 'SUPER_ADMIN') {
      return requestedInstitutionId ? { institutionId: requestedInstitutionId } : {};
    }
    return { institutionId: this.tenant.requireInstitution(user) };
  }

  private async studentGrade(user: RequestUser): Promise<string | null> {
    if (user.role !== 'STUDENT') return null;
    const student = await this.identity.resolveForUser(user);
    return student?.grade ?? null;
  }

  private async resolveMapping(input: {
    chapterId?: string;
    conceptId?: string;
    grade?: string;
    subjectId?: string;
  }): Promise<{ grade?: string; subjectId?: string }> {
    const result: { grade?: string; subjectId?: string } = {};
    if (input.chapterId) {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: input.chapterId },
        select: { id: true, grade: true, subjectId: true },
      });
      if (!chapter) throw new BadRequestException('Chapter not found');
      result.grade = input.grade ?? chapter.grade;
      result.subjectId = input.subjectId ?? chapter.subjectId;
    }
    if (input.conceptId) {
      const concept = await this.prisma.concept.findUnique({
        where: { id: input.conceptId },
        select: { id: true, topic: { select: { chapterId: true, chapter: { select: { grade: true, subjectId: true } } } } },
      });
      if (!concept) throw new BadRequestException('Concept not found');
      const chapterId = concept.topic?.chapterId;
      if (input.chapterId && chapterId && input.chapterId !== chapterId) {
        throw new BadRequestException('Concept does not belong to the selected chapter');
      }
      result.grade = result.grade ?? concept.topic?.chapter?.grade;
      result.subjectId = result.subjectId ?? concept.topic?.chapter?.subjectId;
      if (!input.chapterId) result.subjectId = result.subjectId;
    }
    return result;
  }

  private async snapshot(
    item: { id: string; version: number; title: string; status: string; modelKey: string | null },
    user: RequestUser,
    reason: string,
  ) {
    await this.prisma.arContentVersion.create({
      data: {
        arContentId: item.id,
        version: item.version,
        modelKey: item.modelKey,
        createdById: user.sub,
        snapshot: { title: item.title, status: item.status, reason, version: item.version },
      },
    });
  }

  private assertFile(file?: Express.Multer.File) {
    if (!file || !file.buffer?.length) throw new BadRequestException('No file uploaded');
  }

  private modelMime(extension: string) {
    if (extension === '.glb') return 'model/gltf-binary';
    if (extension === '.gltf') return 'model/gltf+json';
    return 'model/vnd.usdz+zip';
  }

  private difficulty(value?: string): any {
    const allowed = ['EASY', 'MEDIUM', 'HARD'];
    const upper = (value ?? 'MEDIUM').toUpperCase();
    return allowed.includes(upper) ? upper : 'MEDIUM';
  }

  private visibility(value: string): any {
    const allowed = ['PUBLIC', 'INSTITUTION_ONLY', 'PRIVATE'];
    const upper = (value ?? 'INSTITUTION_ONLY').toUpperCase();
    return allowed.includes(upper) ? upper : 'INSTITUTION_ONLY';
  }
}
