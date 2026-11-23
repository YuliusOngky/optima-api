// sellers/sellers.service.ts
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

  async register(data: {
    storeName: string;
    city: string;
    email: string;
    ownerName?: string;
    description?: string;
    phone?: string;
  }) {
    const storeName = data.storeName?.trim();
    const city = data.city?.trim();
    const email = data.email?.trim().toLowerCase();
    if (!storeName || !city || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Nama toko, kota, dan email yang valid wajib diisi');
    }

    const description = [data.description?.trim(), data.phone?.trim() ? `HP: ${data.phone.trim()}` : '']
      .filter(Boolean)
      .join('\n');

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      include: { seller: true },
    });
    if (existingUser?.seller) {
      throw new ConflictException('Email ini sudah terdaftar sebagai penjual');
    }

    const user = existingUser
      ? await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: 'SELLER',
            name: data.ownerName?.trim() || existingUser.name,
          },
        })
      : await this.prisma.user.create({
          data: {
            email,
            name: data.ownerName?.trim() || storeName,
            role: 'SELLER',
          },
        });

    let slug = toSlug(storeName) || 'toko';
    const existingSlug = await this.prisma.seller.findUnique({ where: { slug } });
    if (existingSlug) slug = `${slug}-${Date.now()}`;

    const seller = await this.prisma.seller.create({
      data: {
        userId: user.id,
        name: storeName,
        slug,
        city,
        description: description || null,
        isActive: false,
      },
    });

    return { success: true, sellerId: seller.id, message: 'Toko berhasil didaftarkan, menunggu verifikasi.' };
  }
}
