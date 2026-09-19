import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BannerType } from '@prisma/client';

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  findAll(type?: 'HERO' | 'SIDE') {
    return this.prisma.banner.findMany({
      where: { isActive: true, ...(type ? { type: type as BannerType } : {}) },
      orderBy: { sortOrder: 'asc' },
    });
  }

  create(data: any) {
    return this.prisma.banner.create({ data });
  }

  update(id: number, data: any) {
    return this.prisma.banner.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.banner.delete({ where: { id } });
  }
}
