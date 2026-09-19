// categories/categories.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Public } from '../auth/public.decorator';

@Public()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }
}
