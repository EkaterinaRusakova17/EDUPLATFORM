import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser } from '../common/auth-user.interface';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AuthUser['role'][]) =>
  SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<AuthUser['role'][]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!roles?.length) return true;

    const user = context.switchToHttp().getRequest().user as AuthUser;
    return Boolean(user && roles.includes(user.role));
  }
}
