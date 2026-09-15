import { Role } from '@sanro/types';

export interface RequestUser {
  sub: string;
  role: Role;
  institutionId?: string;
  name?: string;
  email?: string;
  jti: string;
}

export interface RequestWithUser extends Request {
  user: RequestUser;
}