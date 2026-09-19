// auth/current-user.decorator.ts — Extract authenticated user from request
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from './supabase.strategy';

/**
 * Extract the current authenticated user from the request.
 * @example getProfile(@CurrentUser() user: AuthenticatedUser)
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
