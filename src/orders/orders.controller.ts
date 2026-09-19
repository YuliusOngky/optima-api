import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import type { AuthenticatedUser } from '../auth/supabase.strategy';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles('BUYER', 'SELLER')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(user.id, dto);
  }

  @Get()
  @Roles('BUYER', 'SELLER', 'ADMIN')
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.findAllByUser(user.id);
  }

  @Get(':id')
  @Roles('BUYER', 'SELLER', 'ADMIN')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.findOne(id, user.id);
  }

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  handleWebhook(@Body() body: Record<string, unknown>) {
    return this.ordersService.handleWebhook(body);
  }
}
