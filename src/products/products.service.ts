import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: { cat?: string; q?: string; sellerId?: number; limit?: number; page?: number }) {
    const { cat, q, sellerId, limit = 20, page = 1 } = filters;
    return this.prisma.product.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: {
        isActive: true,
        ...(cat ? { category: { slug: cat } } : {}),
        ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
        ...(sellerId ? { sellerId } : {}),
      },
      include: {
        seller: { select: { id: true, name: true, city: true, rating: true } },
        category: { select: { id: true, name: true, slug: true, icon: true } },
      },
      orderBy: { totalSold: 'desc' },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        seller: true,
        category: true,
        reviews: { include: { user: { select: { name: true, avatar: true } } }, take: 10 },
      },
    });
    if (!product) throw new NotFoundException(`Product #${id} not found`);
    return product;
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...dto,
        slug: dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now(),
      },
    });
  }

  async update(id: number, dto: Partial<CreateProductDto>) {
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data: { isActive: false } });
  }
}
