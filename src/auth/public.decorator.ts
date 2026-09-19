// auth/public.decorator.ts — Mark a route as public (no auth required)
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a controller method or class as public (skip JWT auth).
 * @example @Public()
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
