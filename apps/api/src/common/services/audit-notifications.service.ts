import { Injectable } from '@nestjs/common';
import { AuditAction, NotificationEvent } from '@sanro/types';
import { NotificationEventType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    userId: string;
    institutionId?: string | null;
    action: AuditAction;
    entityType?: string | null;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.auditLog.create({
      data: {
        userId: params.userId,
        institutionId: params.institutionId ?? null,
        action: params.action as unknown as Prisma.AuditLogCreateInput['action'],
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
        metadata: (params.metadata ?? {}) as object,
      },
    });
  }
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    recipientUserId: string;
    type: NotificationEvent;
    title: string;
    body: string;
    entityType?: string | null;
    entityId?: string | null;
  }) {
    return this.prisma.notification.create({
      data: {
        recipientId: params.recipientUserId,
        type: params.type as NotificationEventType,
        channel: 'IN_APP',
        title: params.title,
        body: params.body,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
      },
    });
  }

  async listForUser(userId: string, unreadOnly: boolean) {
    return this.prisma.notification.findMany({
      where: { recipientId: userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { recipientId: userId, readAt: null },
    });
    return { count };
  }

  async markRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, recipientId: userId },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { recipientId: userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}