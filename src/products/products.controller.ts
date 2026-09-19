// products/products.controller.ts
import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Public } from '../auth/public.decorator';

@Public()  // All product reads are public
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(
    @Query('cat') cat?: string,
    @Query('q') q?: string,
    @Query('sellerId') sellerId?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.productsService.findAll({
      cat,
      q,
      sellerId: sellerId ? Number(sellerId) : undefined,
      limit: limit ? Number(limit) : 20,
      page: page ? Number(page) : 1,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }
}
