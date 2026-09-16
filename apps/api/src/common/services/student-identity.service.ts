import { Injectable, NotFoundException } from '@nestjs/common';
import { RequestUser } from '../types/auth-context';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Resolves the single Student profile that a signed-in user maps to.
 *
 * The Student.userId link is only written when a student is created with
 * credentials. Accounts invited later (or created without an email) can end up
 * with a Student row whose userId is null, which used to surface as a confusing
 * "Student profile not found" across remediation, diagnosis, assessments,
 * dashboard and learning flows.
 *
 * resolveForUser repairs that invariant in-place: when the account has a
 * STUDENT role in an institution and exactly one matching unlinked Student row
 * exists (same institution, matching email or phone), it links them.
 */
@Injectable()
export class StudentIdentityService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveForUser(user: RequestUser) {
    const byUserId = await this.prisma.student.findFirst({ where: { userId: user.sub } });
    if (byUserId) return byUserId;

    if (user.role !== 'STUDENT' || !user.institutionId) return null;

    const profile = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { email: true, phone: true },
    });
    if (!profile) return null;

    const match = await this.prisma.student.findFirst({
      where: {
        institutionId: user.institutionId,
        userId: null,
        OR: [
          ...(profile.email ? [{ email: profile.email.toLowerCase() }] : []),
          ...(profile.phone ? [{ phone: profile.phone }] : []),
        ],
      },
    });
    if (!match) return null;

    return this.prisma.student.update({ where: { id: match.id }, data: { userId: user.sub } });
  }

  async requireForUser(user: RequestUser) {
    const student = await this.resolveForUser(user);
    if (!student) throw new NotFoundException('Student profile not found');
    return student;
  }
}