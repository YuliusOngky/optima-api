// banners/banners.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { BannersService } from './banners.service';
import { Public } from '../auth/public.decorator';

@Public()
@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  findAll(@Query('type') type?: string) {
    return this.bannersService.findAll(type as 'HERO' | 'SIDE' | undefined);
  }
}
