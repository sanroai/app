import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationsService } from '../common/services/audit-notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUser } from '../common/types/auth-context';
import { Language } from '@sanro/types';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @Get('me')
  async me(@CurrentUser() user: RequestUser) {
    const profile = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        isActive: true,
        isSuperAdmin: true,
        language: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
        memberships: {
          where: { status: 'ACTIVE' },
          select: {
            role: true,
            status: true,
            joinedAt: true,
            institution: { select: { id: true, name: true, type: true, logoUrl: true } },
          },
          orderBy: { joinedAt: 'desc' },
        },
      },
    });
    return profile;
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: RequestUser,
    @Body() body: { name?: string; phone?: string; language?: Language; avatarUrl?: string },
  ) {
    if (body.language && !['EN', 'MR', 'HI'].includes(body.language)) {
      throw new BadRequestException('Invalid language');
    }
    return this.prisma.user.update({
      where: { id: user.sub },
      data: {
        name: body.name,
        phone: body.phone,
        language: body.language ? (body.language as Language) : undefined,
        avatarUrl: body.avatarUrl,
      },
      select: { id: true, name: true, phone: true, language: true, avatarUrl: true },
    });
  }

  @Get('me/notifications')
  listNotifications(@CurrentUser() user: RequestUser) {
    return this.notifications.listForUser(user.sub, false);
  }

  @Post('me/notifications/:id/read')
  readNotification(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.notifications.markRead(user.sub, id);
  }
}