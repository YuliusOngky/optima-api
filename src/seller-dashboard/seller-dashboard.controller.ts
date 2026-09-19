import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { SellerDashboardService } from './seller-dashboard.service';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/supabase.strategy';
import {
  CreateSellerProductDto,
  UpdateSellerProductDto,
  UpdateOrderStatusDto,
} from './dto/seller-product.dto';

@Controller('seller-dashboard')
@Roles('SELLER', 'ADMIN')
export class SellerDashboardController {
  constructor(private readonly service: SellerDashboardService) {}

  // ─── Stats ───────────────────────────────────────────────────────────────

  @Get('stats')
  getStats(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getStats(user.id);
  }

  // ─── Products ─────────────────────────────────────────────────────────────

  @Get('products')
  getProducts(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getProducts(user.id, Number(page ?? 1), Number(limit ?? 20));
  }

  @Post('products')
  createProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSellerProductDto,
  ) {
    return this.service.createProduct(user.id, dto);
  }

  @Patch('products/:id')
  updateProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSellerProductDto,
  ) {
    return this.service.updateProduct(user.id, id, dto);
  }

  @Delete('products/:id')
  deleteProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.deleteProduct(user.id, id);
  }

  // ─── Orders ───────────────────────────────────────────────────────────────

  @Get('orders')
  getOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getOrders(user.id, Number(page ?? 1), Number(limit ?? 20));
  }

  @Patch('orders/:id/status')
  updateOrderStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.service.updateOrderStatus(user.id, id, dto.status);
  }
}
