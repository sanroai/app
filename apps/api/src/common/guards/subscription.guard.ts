import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, SUBSCRIPTION_REQUIRED_KEY } from '../decorators/auth.decorators';
import { SubscriptionAccessService } from '../security/subscription-access.service';
import { EntitlementService } from '../security/entitlement.service';
import { RequestUser } from '../types/auth-context';

/**
 * Route-level subscription/entitlement gate.
 *
 * Apply with @SubscriptionRequired() (class or handler level). Also enforced
 * globally in app.module.ts for every non-public route; public routes are
 * always allowed.
 *
 * Users WITH an institution context (institutionId claim) are validated via
 * the institution subscription path (SubscriptionAccessService). Users WITHOUT
 * one (direct SANRO students/parents, SUPER_ADMIN) are validated via the
 * entitlement service (direct subscription + parent child aggregation).
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscription: SubscriptionAccessService,
    private readonly entitlement: EntitlementService,
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

    if (user.institutionId) {
      await this.subscription.assertCanAccess(user);
    } else {
      await this.entitlement.assertCanAccess(user);
    }
    return true;
  }
}