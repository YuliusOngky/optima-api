import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { CreateSellerProductDto, UpdateSellerProductDto } from './dto/seller-product.dto';

@Injectable()
export class SellerDashboardService {
  constructor(private prisma: PrismaService) {}

  private async getSeller(userId: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException('Toko tidak ditemukan. Silakan daftar sebagai seller terlebih dahulu.');
    return seller;
  }

  // ─── Stats ───────────────────────────────────────────────────────────────

  async getStats(userId: string) {
    const seller = await this.getSeller(userId);

    const [totalProducts, orders, topProducts] = await Promise.all([
      this.prisma.product.count({ where: { sellerId: seller.id, isActive: true } }),
      this.prisma.order.findMany({
        where: { sellerId: seller.id },
        select: { status: true, totalAmount: true, shippingFee: true, createdAt: true },
      }),
      this.prisma.product.findMany({
        where: { sellerId: seller.id, isActive: true },
        orderBy: { totalSold: 'desc' },
        take: 5,
        select: { id: true, name: true, imageUrls: true, price: true, totalSold: true, stock: true },
      }),
    ]);

    const paidOrders = orders.filter(o =>
      [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED, 'DONE'].includes(o.status as OrderStatus),
    );
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount - o.shippingFee, 0);
    const pendingCount = orders.filter(o => o.status === OrderStatus.PENDING).length;

    // Revenue by month (last 6 months)
    const now = new Date();
    const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const label = d.toLocaleString('id-ID', { month: 'short', year: '2-digit' });
      const revenue = paidOrders
        .filter(o => {
          const od = new Date(o.createdAt);
          return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth();
        })
        .reduce((sum, o) => sum + o.totalAmount - o.shippingFee, 0);
      return { label, revenue };
    });

    return {
      totalProducts,
      totalOrders: orders.length,
      paidOrders: paidOrders.length,
      pendingOrders: pendingCount,
      totalRevenue,
      monthlyRevenue,
      topProducts,
      seller: { id: seller.id, name: seller.name, rating: seller.rating, totalSales: seller.totalSales },
    };
  }

  // ─── Products ─────────────────────────────────────────────────────────────

  async getProducts(userId: string, page = 1, limit = 20) {
    const seller = await this.getSeller(userId);
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { sellerId: seller.id },
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where: { sellerId: seller.id } }),
    ]);
    return { products, total, page, limit };
  }

  async createProduct(userId: string, dto: CreateSellerProductDto) {
    const seller = await this.getSeller(userId);
    const slug =
      dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') +
      '-' + Date.now();
    return this.prisma.product.create({
      data: { ...dto, sellerId: seller.id, slug },
    });
  }

  async updateProduct(userId: string, productId: number, dto: UpdateSellerProductDto) {
    const seller = await this.getSeller(userId);
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
    if (product.sellerId !== seller.id) throw new ForbiddenException('Bukan produk milikmu');
    return this.prisma.product.update({ where: { id: productId }, data: dto });
  }

  async deleteProduct(userId: string, productId: number) {
    const seller = await this.getSeller(userId);
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
    if (product.sellerId !== seller.id) throw new ForbiddenException('Bukan produk milikmu');
    return this.prisma.product.update({ where: { id: productId }, data: { isActive: false } });
  }

  // ─── Orders ───────────────────────────────────────────────────────────────

  async getOrders(userId: string, page = 1, limit = 20) {
    const seller = await this.getSeller(userId);
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { sellerId: seller.id },
        include: {
          items: {
            include: { product: { select: { id: true, name: true, imageUrls: true } } },
          },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where: { sellerId: seller.id } }),
    ]);
    return { orders, total, page, limit };
  }

  async updateOrderStatus(userId: string, orderId: string, status: string) {
    const seller = await this.getSeller(userId);
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    if (order.sellerId !== seller.id) throw new ForbiddenException('Bukan ordermu');

    const allowed = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'DONE', 'CANCELLED'];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`Status tidak valid. Pilih: ${allowed.join(', ')}`);
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus },
    });
  }
}
