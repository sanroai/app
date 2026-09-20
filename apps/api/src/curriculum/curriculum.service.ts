import { ForbiddenException, Injectable } from '@nestjs/common';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';

export interface CurriculumScope {
  allBoards: boolean;
  boardIds: Set<string>;
  fullBoards: Set<string>;
  gradeScopes: Map<string, Set<string>>;
  subjectScopes: Map<string, Set<string | null>>;
}

@Injectable()
export class CurriculumService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
  ) {}

  async institutionScope(user: RequestUser): Promise<CurriculumScope> {
    if (user.role === 'SUPER_ADMIN' || !user.institutionId) {
      return { allBoards: true, boardIds: new Set(), fullBoards: new Set(), gradeScopes: new Map(), subjectScopes: new Map() };
    }
    const institutionId = this.tenant.requireInstitution(user);
    const rows = await this.prisma.institutionCurriculumAccess.findMany({ where: { institutionId } });

    const boardIds = new Set<string>();
    const fullBoards = new Set<string>();
    const gradeScopes = new Map<string, Set<string>>();
    const subjectScopes = new Map<string, Set<string | null>>();

    for (const row of rows) {
      boardIds.add(row.boardId);
      if (row.subjectId) {
        const grades = subjectScopes.get(row.subjectId) ?? new Set<string | null>();
        grades.add(row.grade ?? null);
        subjectScopes.set(row.subjectId, grades);
      } else if (row.grade) {
        const grades = gradeScopes.get(row.boardId) ?? new Set<string>();
        grades.add(row.grade);
        gradeScopes.set(row.boardId, grades);
      } else {
        fullBoards.add(row.boardId);
      }
    }

    return { allBoards: false, boardIds, fullBoards, gradeScopes, subjectScopes };
  }

  private gradeAllowed(scope: CurriculumScope, boardId: string, grade: string): boolean {
    const grades = scope.gradeScopes.get(boardId);
    if (!grades) return true;
    return grades.has(grade);
  }

  private subjectAllowed(scope: CurriculumScope, subject: { boardId: string; id: string }, grade?: string): boolean {
    if (scope.allBoards || scope.fullBoards.has(subject.boardId)) return true;
    const grades = scope.subjectScopes.get(subject.id);
    if (grades) {
      if (!grade) return true;
      return grades.has(grade) || grades.has(null);
    }
    return this.gradeAllowed(scope, subject.boardId, grade ?? '');
  }

  async accessibleBoards(user: RequestUser): Promise<string[]> {
    const scope = await this.institutionScope(user);
    if (scope.allBoards) return (await this.prisma.board.findMany({ where: { active: true }, select: { id: true } })).map((b) => b.id);
    return [...scope.boardIds];
  }

  async listBoards(user: RequestUser) {
    const scope = await this.institutionScope(user);
    const boards = await this.prisma.board.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
    return scope.allBoards ? boards : boards.filter((b) => scope.boardIds.has(b.id));
  }

  async listGrades(user: RequestUser, boardId?: string) {
    const scope = await this.institutionScope(user);
    const grades = await this.prisma.grade.findMany({
      where: boardId ? { boardId } : {},
      orderBy: { order: 'asc' },
    });
    if (scope.allBoards) return grades.map((g) => g.name);
    if (boardId && scope.fullBoards.has(boardId)) return grades.map((g) => g.name);
    if (boardId && !scope.boardIds.has(boardId)) return [];
    const allowedGrades = scope.gradeScopes.get(boardId ?? '') ?? new Set<string>();
    if (boardId && allowedGrades.size > 0) return grades.filter((g) => allowedGrades.has(g.name)).map((g) => g.name);
    return grades.map((g) => g.name);
  }

  async listSubjects(user: RequestUser, boardId: string, grade?: string) {
    const scope = await this.institutionScope(user);
    const boards = await this.prisma.board.findMany({ where: boardId ? { id: boardId } : {} });
    const resolvedBoardId = boardId ?? boards[0]?.id;
    if (!resolvedBoardId) return [];
    if (!scope.allBoards && boardId && !scope.boardIds.has(boardId)) return [];

    const all = await this.prisma.subject.findMany({
      where: { boardId: resolvedBoardId, active: true },
      orderBy: { order: 'asc' },
    });

    if (!scope.allBoards && !scope.fullBoards.has(resolvedBoardId)) {
      const visible = all.filter((s) => this.subjectAllowed(scope, s, grade));
      if (visible.length === 0) return [];
      return visible.map((s) => ({ ...s, chapters: grade ? [] : undefined }));
    }

    return all.map((s) => ({ ...s, chapters: grade ? [] : undefined }));
  }

  async listChapters(user: RequestUser, subjectId: string) {
    const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return [];
    const scope = await this.institutionScope(user);
    if (!this.subjectAllowed(scope, subject)) return [];

    const chapters = await this.prisma.chapter.findMany({
      where: { subjectId },
      orderBy: [{ grade: 'asc' }, { order: 'asc' }],
    });
    if (scope.allBoards || scope.fullBoards.has(subject.boardId)) return chapters;

    const grades = scope.subjectScopes.get(subject.id);
    if (grades && !grades.has(null)) {
      return chapters.filter((c) => grades.has(c.grade));
    }
    return chapters;
  }

  async listTopics(user: RequestUser, chapterId: string) {
    const chapter = await this.prisma.chapter.findUnique({ where: { id: chapterId }, include: { subject: true } });
    if (!chapter) return [];
    const scope = await this.institutionScope(user);
    if (!this.subjectAllowed(scope, chapter.subject)) return [];
    return this.prisma.topic.findMany({
      where: { chapterId },
      orderBy: { order: 'asc' },
      include: { concepts: { orderBy: { order: 'asc' } } },
    });
  }

  async listConcepts(user: RequestUser, topicId: string) {
    const topic = await this.prisma.topic.findUnique({ where: { id: topicId }, include: { chapter: { include: { subject: true } } } });
    if (!topic) return [];
    const scope = await this.institutionScope(user);
    if (!this.subjectAllowed(scope, topic.chapter.subject)) return [];
    return this.prisma.concept.findMany({ where: { topicId }, orderBy: { order: 'asc' } });
  }

  async tree(user: RequestUser, boardId?: string, grade?: string, subjectId?: string) {
    const scope = await this.institutionScope(user);
    const boards = await this.prisma.board.findMany({ where: { id: boardId ?? undefined } });
    const selectedBoard = boardId ?? boards[0]?.id;
    if (!selectedBoard) return [];
    if (!scope.allBoards && !scope.boardIds.has(selectedBoard)) return [];

    const allSubjects = await this.prisma.subject.findMany({
      where: { boardId: selectedBoard, active: true, ...(subjectId ? { id: subjectId } : {}) },
      orderBy: { order: 'asc' },
      include: {
        chapters: {
          where: grade ? { grade } : {},
          orderBy: { order: 'asc' },
          include: {
            topics: {
              orderBy: { order: 'asc' },
              include: { concepts: { orderBy: { order: 'asc' } } },
            },
          },
        },
      },
    });

    const subjects = allSubjects.filter((s) => this.subjectAllowed(scope, s, grade));

    return subjects.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      chapters: s.chapters.map((c) => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
        topics: c.topics.map((t) => ({
          id: t.id,
          name: t.name,
          concepts: t.concepts.map((con) => ({ id: con.id, name: con.name, order: con.order })),
        })),
      })),
    }));
  }

  async createBoard(user: RequestUser, data: { name: string; code: string }) {
    this.requireGlobalEditor(user);
    return this.prisma.board.create({
      data: { name: data.name, code: data.code.toUpperCase().replace(/\s+/g, '_') },
    });
  }

  async createSubject(user: RequestUser, data: { boardId: string; name: string; code: string; icon?: string; color?: string; order?: number; description?: string }) {
    this.requireGlobalEditor(user);
    return this.prisma.subject.create({
      data: {
        boardId: data.boardId,
        name: data.name,
        code: data.code.toUpperCase().replace(/\s+/g, '_'),
        icon: data.icon ?? null,
        color: data.color ?? null,
        order: data.order ?? 0,
        description: data.description ?? null,
      },
    });
  }

  async createChapter(user: RequestUser, data: { subjectId: string; name: string; code: string; grade: string; order?: number; description?: string }) {
    this.requireGlobalEditor(user);
    return this.prisma.chapter.create({
      data: {
        subjectId: data.subjectId,
        name: data.name,
        code: data.code.toUpperCase().replace(/\s+/g, '_'),
        grade: data.grade,
        order: data.order ?? 0,
        description: data.description ?? null,
      },
    });
  }

  async createTopic(user: RequestUser, data: { chapterId: string; name: string; order?: number }) {
    this.requireGlobalEditor(user);
    return this.prisma.topic.create({ data: { chapterId: data.chapterId, name: data.name, order: data.order ?? 0 } });
  }

  async createConcept(user: RequestUser, data: { topicId: string; name: string; order?: number; description?: string }) {
    this.requireGlobalEditor(user);
    return this.prisma.concept.create({
      data: { topicId: data.topicId, name: data.name, order: data.order ?? 0, description: data.description ?? null },
    });
  }

  async createGrade(user: RequestUser, data: { boardId: string; name: string; order?: number }) {
    this.requireGlobalEditor(user);
    return this.prisma.grade.create({ data: { boardId: data.boardId, name: data.name, order: data.order ?? 0 } });
  }

  private requireGlobalEditor(user: RequestUser): void {
    if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only SUPER_ADMIN can modify the canonical curriculum');
    }
  }
}