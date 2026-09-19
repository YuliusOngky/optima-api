// auth/supabase.strategy.ts — Verifies Supabase JWT tokens
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string;          // Supabase user UUID
  email: string;
  role?: string;        // user_metadata.role (set by app)
  iss?: string;         // issuer
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  dbUserId?: number;
}

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Supabase signs JWTs with the JWT_SECRET from your project settings
      secretOrKey: process.env.SUPABASE_JWT_SECRET!,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload.sub) throw new UnauthorizedException('Invalid token payload');

    // Look up our DB user by Supabase UUID
    const dbUser = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    // Determine role: prefer DB record, fall back to JWT metadata
    const role = (dbUser?.role ?? payload.role ?? 'BUYER') as 'BUYER' | 'SELLER' | 'ADMIN';

    return {
      id: payload.sub,
      email: payload.email ?? dbUser?.email ?? '',
      role,
    };
  }
}
