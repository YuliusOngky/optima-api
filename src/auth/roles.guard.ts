// auth/roles.guard.ts — Enforces role-based access control
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import type { AuthenticatedUser } from './supabase.strategy';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No roles required → allow
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) throw new ForbiddenException('Tidak terautentikasi');
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(`Akses ditolak. Diperlukan role: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
