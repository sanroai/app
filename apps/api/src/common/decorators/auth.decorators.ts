import { SetMetadata } from '@nestjs/common';
import { Role } from '@sanro/types';

export const ROLES_KEY = 'sanro:roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const IS_PUBLIC_KEY = 'sanro:isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const TENANT_OPTIONAL_KEY = 'sanro:tenantOptional';
export const TenantOptional = () => SetMetadata(TENANT_OPTIONAL_KEY, true);

export const SUBSCRIPTION_REQUIRED_KEY = 'sanro:subscriptionRequired';
export const SubscriptionRequired = () => SetMetadata(SUBSCRIPTION_REQUIRED_KEY, true);