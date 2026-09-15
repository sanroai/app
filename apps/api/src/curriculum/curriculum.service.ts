import { ForbiddenException, Injectable } from '@nestjs/common';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';

@Injectable()
export class CurriculumService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
  ) {}

  async listBoards() {
    return this.prisma.board.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
  }

  async listGrades(boardId?: string) {
    const grades = await this.prisma.grade.findMany({
      where: boardId ? { boardId } : {},
      orderBy: { order: 'asc' },
    });
    return grades.map((g) => g.name);
  }

  async listSubjects(boardId: string, grade?: string) {
    const boards = await this.prisma.board.findMany({ where: boardId ? { id: boardId } : {} });
    return this.prisma.subject.findMany({
      where: { boardId: boardId ?? boards[0]?.id, active: true },
      orderBy: { order: 'asc' },
      include: { chapters: grade ? { where: { grade }, select: { id: true, name: true, grade: true } } : false },
    });
  }

  async listChapters(subjectId: string) {
    return this.prisma.chapter.findMany({
      where: { subjectId },
      orderBy: [{ grade: 'asc' }, { order: 'asc' }],
    });
  }

  async listTopics(chapterId: string) {
    return this.prisma.topic.findMany({
      where: { chapterId },
      orderBy: { order: 'asc' },
      include: { concepts: { orderBy: { order: 'asc' } } },
    });
  }

  async listConcepts(topicId: string) {
    return this.prisma.concept.findMany({ where: { topicId }, orderBy: { order: 'asc' } });
  }

  async tree(user: RequestUser, boardId?: string, grade?: string, subjectId?: string) {
    void this.tenant.requireInstitution(user);
    const boards = await this.prisma.board.findMany({ where: { id: boardId ?? undefined } });
    const selectedBoard = boardId ?? boards[0]?.id;
    if (!selectedBoard) return [];

    const subjects = await this.prisma.subject.findMany({
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
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'INSTITUTION_ADMIN') {
      throw new ForbiddenException('Only admins can modify curriculum');
    }
  }
}