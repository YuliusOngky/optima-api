// auth/auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SupabaseStrategy } from './supabase.strategy';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [PassportModule],
  providers: [SupabaseStrategy, AuthGuard, RolesGuard],
  exports: [AuthGuard, RolesGuard, SupabaseStrategy],
})
export class AuthModule {}
