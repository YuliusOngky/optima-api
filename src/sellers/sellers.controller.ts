// sellers/sellers.controller.ts
import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { SellersService } from './sellers.service';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/supabase.strategy';

@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Public()
  @Get()
  findAll() {
    return this.sellersService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sellersService.findOne(id);
  }

  @Post('onboard')
  // Requires login (not @Public), BUYER role
  @Roles('BUYER')
  onboard(
    @Body() body: { storeName: string; city: string; description?: string; phone?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sellersService.onboard(user.id, body);
  }
}
