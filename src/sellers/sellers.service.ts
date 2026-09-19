// sellers/sellers.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

@Injectable()
export class SellersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.seller.findMany({
      where: { isActive: true },
      orderBy: { rating: 'desc' },
      include: {
        _count: { select: { products: true } },
      },
    });
  }

  async findOne(id: number) {
    const seller = await this.prisma.seller.findUnique({
      where: { id },
      include: {
        products: {
          where: { isActive: true },
          take: 12,
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { products: true } },
      },
    });
    if (!seller) throw new NotFoundException(`Seller #${id} tidak ditemukan`);
    return seller;
  }

  async onboard(
    supabaseUserId: string,
    data: { storeName: string; city: string; description?: string; phone?: string },
  ) {
    // Upsert user in our DB (may already exist from seed)
    const user = await this.prisma.user.upsert({
      where: { id: supabaseUserId },
      update: { role: 'SELLER' },
      create: {
        id: supabaseUserId,
        email: supabaseUserId, // Will be updated next login
        name: data.storeName,
        role: 'SELLER',
      },
    });

    // Generate unique slug
    let slug = toSlug(data.storeName);
    const existing = await this.prisma.seller.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const seller = await this.prisma.seller.upsert({
      where: { userId: user.id },
      update: {
        name: data.storeName,
        city: data.city,
        description: data.description,
        isActive: false, // Pending verification
      },
      create: {
        userId: user.id,
        name: data.storeName,
        slug,
        city: data.city,
        description: data.description,
        isActive: false, // Pending verification
      },
    });

    return { success: true, sellerId: seller.id, message: 'Toko berhasil didaftarkan, menunggu verifikasi.' };
  }
}
