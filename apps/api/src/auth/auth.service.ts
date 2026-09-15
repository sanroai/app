import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import { InstitutionType, LoginResponse, Role } from '@sanro/types';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { StringValue } from 'ms';
import { AppConfig } from '../config/app.config';
import { APP_CONFIG_TOKEN } from '../common/common.module';
import { NotificationsService } from '../common/services/audit-notifications.service';
import { PrismaService } from '../prisma/prisma.service';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string | null;
    role: Role;
    institutionId?: string | null;
    isActive: boolean;
    isSuperAdmin: boolean;
  };
  memberships: Array<{ institutionId: string; role: Role; institutionName: string }>;
  institution?: {
    id: string;
    name: string;
    role: Role;
  } | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject(APP_CONFIG_TOKEN) private readonly config: AppConfig,
    private readonly notifications: NotificationsService,
  ) {}

  async registerInstitution(body: {
    institutionName: string;
    institutionType: InstitutionType;
    adminName: string;
    adminEmail: string;
    adminPhone?: string;
    adminPassword: string;
  }): Promise<LoginResult> {
    const email = body.adminEmail.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new UnauthorizedException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(body.adminPassword, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        phone: body.adminPhone ?? null,
        name: body.adminName,
        passwordHash,
      },
    });

    const institution = await this.prisma.institution.create({
      data: {
        name: body.institutionName,
        type: body.institutionType,
        status: 'ACTIVE',
        primaryEmail: email,
        primaryPhone: body.adminPhone ?? null,
        createdById: user.id,
      },
    });

    await this.prisma.institutionMember.create({
      data: {
        institutionId: institution.id,
        userId: user.id,
        role: Role.INSTITUTION_ADMIN,
        status: 'ACTIVE',
      },
    });

    // Trial subscription with default seat limit
    const trialPlan = await this.prisma.plan.findUnique({ where: { key: 'INSTITUTION' } });
    if (trialPlan) {
      await this.prisma.subscription.create({
        data: {
          institutionId: institution.id,
          planId: trialPlan.id,
          status: 'TRIAL',
          seatLimit: trialPlan.perSeat || 100,
        },
      });
    }

    return this.issueLogin(user.id, {
      role: Role.INSTITUTION_ADMIN,
      institutionId: institution.id,
    });
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const normalized = email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.isActive) {
      throw new ForbiddenException('This account has been deactivated');
    }

    return this.issueLogin(user.id, null);
  }

  async switchContext(userId: string, institutionId: string, role: Role) {
    const membership = await this.prisma.institutionMember.findUnique({
      where: { institutionId_userId: { institutionId, userId } },
    });
    if (!membership || membership.role !== role) {
      throw new ForbiddenException('You are not a member of this institution in this role');
    }
    if (membership.status !== 'ACTIVE') {
      throw new ForbiddenException('This membership is not active');
    }
    return this.issueLogin(userId, { role: membership.role, institutionId });
  }

  private async issueLogin(
    userId: string,
    context: { role: Role; institutionId: string } | null,
  ): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    let role: Role;
    let institutionId: string | null = null;

    if (user.isSuperAdmin) {
      role = Role.SUPER_ADMIN;
    } else if (context) {
      role = context.role;
      institutionId = context.institutionId;
    } else {
      const memberships = await this.prisma.institutionMember.findMany({
        where: { userId, status: 'ACTIVE' },
        orderBy: { joinedAt: 'desc' },
        include: { institution: true },
      });
      if (memberships.length === 0) {
        throw new UnauthorizedException('No active institution membership');
      }
      const primary = memberships[0];
      role = primary.role;
      institutionId = primary.institutionId;
    }

    const accessToken = await this.signAccessToken(user, role, institutionId);
    const refresh = await this.createRefreshSession(user.id);

    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });

    const memberships = user.isSuperAdmin
      ? []
      : await this.prisma.institutionMember.findMany({
          where: { userId },
          include: { institution: { select: { id: true, name: true } } },
        });

    return {
      accessToken,
      refreshToken: refresh.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role,
        institutionId,
        isActive: user.isActive,
        isSuperAdmin: user.isSuperAdmin,
      },
      memberships: memberships.map((m) => ({
        institutionId: m.institutionId,
        role: m.role as Role,
        institutionName: (m.institution?.name ?? '') as string,
      })),
      institution: role !== Role.SUPER_ADMIN && institutionId
        ? {
            id: institutionId,
            name: memberships.find((m) => m.institutionId === institutionId)?.institution
              ?.name as string,
            role,
          }
        : null,
    };
  }

  private async signAccessToken(
    user: { id: string; email: string; name: string },
    role: Role,
    institutionId: string | null,
  ): Promise<string> {
    const payload = {
      sub: user.id,
      role,
      institutionId: institutionId ?? undefined,
      name: user.name,
      email: user.email,
    };
    return this.jwtService.signAsync(payload, {
      secret: this.config.AUTH_SECRET,
      expiresIn: this.config.AUTH_TOKEN_EXPIRES_IN as StringValue,
      issuer: this.config.AUTH_ISSUER,
      audience: 'sanro-app',
    });
  }

  private async createRefreshSession(userId: string): Promise<{ refreshToken: string }> {
    const jti = randomUUID();
    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, jti, type: 'refresh' },
      {
        secret: this.config.AUTH_SECRET,
        expiresIn: this.config.AUTH_REFRESH_EXPIRES_IN as StringValue,
        issuer: this.config.AUTH_ISSUER,
        audience: 'sanro-app',
      },
    );
    const exp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.prisma.session.create({
      data: { userId, refreshJti: jti, expiresAt: exp },
    });
    return { refreshToken };
  }

  async refresh(refreshToken: string): Promise<LoginResponse> {
    let payload: { sub: string; jti: string; type: string };
    try {
      payload = await this.jwtService.verifyAsync<{ sub: string; jti: string; type: string }>(
        refreshToken,
        { secret: this.config.AUTH_SECRET },
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.type !== 'refresh') throw new UnauthorizedException('Invalid token type');

    const session = await this.prisma.session.findUnique({
      where: { refreshJti: payload.jti },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired; please sign in again');
    }
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const result = await this.issueLogin(payload.sub, null);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user as LoginResponse['user'],
    };
  }

  async logout(userId: string, jti: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, refreshJti: jti },
      data: { revokedAt: new Date() },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('User not found');
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');
    const hash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    await this.prisma.session.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });
  }

  async forgotPassword(email: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return '';
    }
    const token = randomUUID();
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.prisma.passwordResetToken.create({
      data: { tokenHash, userId: user.id, expiresAt },
    });
    this.logger.warn(`[dev] password reset token for ${email}: ${token}`);
    return token;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokens = await this.prisma.passwordResetToken.findMany({
      where: { usedAt: null, expiresAt: { gt: new Date() } },
    });
    let match: (typeof tokens)[number] | null = null;
    for (const t of tokens) {
      if (await bcrypt.compare(token, t.tokenHash)) {
        match = t;
        break;
      }
    }
    if (!match) throw new UnauthorizedException('Invalid or expired reset token');
    const hash = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: match.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({ where: { id: match.userId }, data: { passwordHash: hash } }),
      this.prisma.session.updateMany({ where: { userId: match.userId }, data: { revokedAt: new Date() } }),
    ]);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: { include: { institution: true } },
      },
    });
    if (!user) throw new UnauthorizedException('User not found');
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async sendWelcomeNotification(userId: string): Promise<void> {
    await this.notifications.create({
      recipientUserId: userId,
      type: 'ACHIEVEMENT_UNLOCKED',
      title: 'Welcome to Sanro AI',
      body: 'Your account is ready. Explore assessments, diagnosis and learning.',
    });
  }
}