// categories/categories.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    const cat = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        products: {
          where: { isActive: true },
          take: 20,
          orderBy: { totalSold: 'desc' },
          include: { seller: { select: { id: true, name: true, city: true } } },
        },
        _count: { select: { products: true } },
      },
    });
    if (!cat) throw new NotFoundException(`Category '${slug}' tidak ditemukan`);
    return cat;
  }
}
