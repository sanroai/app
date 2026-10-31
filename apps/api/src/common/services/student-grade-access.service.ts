import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestUser } from '../types/auth-context';
import { StudentIdentityService } from './student-identity.service';

/**
 * The classes a signed-in student may read.
 *
 * `unrestricted` is the historical "no class on record" behaviour: staff, a
 * student whose class was never filled in (every row the bulk importer creates),
 * and `Student.allGrades` (the demo account that opens every class). Otherwise
 * `grades` is the union of the primary class and every enrolment.
 */
export interface GradeAccess {
  unrestricted: boolean;
  grades: string[];
}

const DENIED = 'You can only access content for your classes';

function sortGrades(grades: string[]): string[] {
  return [...grades].sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.localeCompare(b);
  });
}

/**
 * One answer to "which classes may this student see?".
 *
 * Content access used to compare `Student.grade` with `chapter.grade` in nine
 * places spread across learning, chat and AR. A student can now be enrolled in
 * several classes, so every one of those comparisons goes through here instead
 * of reading the single grade field - otherwise a class-8 student enrolled in
 * class-9 mathematics could open neither the hub nor the textbook of one of them.
 */
@Injectable()
export class StudentGradeAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly identity: StudentIdentityService,
  ) {}

  /** Access of the signed-in user (unrestricted for anyone who is not a student). */
  async forUser(user: RequestUser): Promise<GradeAccess> {
    if (user.role !== 'STUDENT') return { unrestricted: true, grades: [] };
    const student = await this.identity.resolveForUser(user);
    if (!student) return { unrestricted: true, grades: [] };
    return this.forStudentId(student.id);
  }

  /** Access of one student row (used by reports and admin screens). */
  async forStudentId(studentId: string): Promise<GradeAccess> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        grade: true,
        allGrades: true,
        enrolments: { select: { grade: true } },
      },
    });
    if (!student) return { unrestricted: true, grades: [] };
    if (student.allGrades) return { unrestricted: true, grades: [] };

    const grades = sortGrades([
      ...new Set(
        [student.grade, ...student.enrolments.map((e) => e.grade)]
          .map((g) => g?.trim())
          .filter((g): g is string => Boolean(g)),
      ),
    ]);
    if (grades.length === 0) return { unrestricted: true, grades: [] };
    return { unrestricted: false, grades };
  }

  allows(access: GradeAccess, grade: string | null | undefined): boolean {
    if (access.unrestricted) return true;
    if (!grade) return true;
    return access.grades.includes(grade);
  }

  assert(access: GradeAccess, grade: string | null | undefined): void {
    if (!this.allows(access, grade)) throw new ForbiddenException(DENIED);
  }

  /** Replace every enrolment of a student (people module, admin, seed). */
  async setEnrolments(studentId: string, grades: string[]): Promise<void> {
    const wanted = sortGrades([
      ...new Set(grades.map((g) => g.trim()).filter((g) => g.length > 0)),
    ]);
    await this.prisma.$transaction([
      this.prisma.studentEnrolment.deleteMany({ where: { studentId } }),
      ...(wanted.length
        ? [
            this.prisma.studentEnrolment.createMany({
              data: wanted.map((grade) => ({ studentId, grade })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);
  }

  /** Add one enrolment without touching the others. */
  async addEnrolment(studentId: string, grade: string): Promise<void> {
    const value = grade.trim();
    if (!value) return;
    await this.prisma.studentEnrolment.upsert({
      where: { studentId_grade: { studentId, grade: value } },
      update: {},
      create: { studentId, grade: value },
    });
  }
}
