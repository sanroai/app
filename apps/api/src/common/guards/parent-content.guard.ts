import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

export const PARENT_RESTRICTED_KEY = 'parentRestricted';

@Injectable()
export class ParentContentGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isRestricted = this.reflector.getAllAndOverride<boolean>(PARENT_RESTRICTED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!isRestricted) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('Not authenticated');

    if (user.role === Role.PARENT) {
      throw new ForbiddenException(
        'Learning content is available to your child. You can view progress and reports in the dashboard.',
      );
    }

    return true;
  }
}
