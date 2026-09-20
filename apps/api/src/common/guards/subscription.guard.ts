import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, SUBSCRIPTION_REQUIRED_KEY } from '../decorators/auth.decorators';
import { SubscriptionAccessService } from '../security/subscription-access.service';
import { RequestUser } from '../types/auth-context';

/**
 * Route-level subscription/entitlement gate.
 *
 * Apply with @SubscriptionRequired() (class or handler level). Also enforced
 * globally in app.module.ts for every non-public route; SUPER_ADMIN and
 * institution-less requests are allowed through (their services require a
 * tenant anyway). Public routes are always allowed.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscription: SubscriptionAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<boolean>(SUBSCRIPTION_REQUIRED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestUser | undefined;
    if (!user) return true;

    await this.subscription.assertCanAccess(user);
    return true;
  }
}