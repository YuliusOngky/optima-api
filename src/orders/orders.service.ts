import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MidtransService } from '../midtrans/midtrans.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private midtrans: MidtransService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) throw new BadRequestException('User not found');

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { seller: { select: { id: true } } },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products are unavailable');
    }

    // Use the first product's seller (simplified single-seller order)
    const sellerId = products[0].seller.id;

    const itemsTotal = dto.items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId)!;
      return sum + Number(product.price) * item.quantity;
    }, 0);

    const totalAmount = itemsTotal + dto.shippingFee;
    const orderNumber = `OPT-${Date.now()}-${userId.substring(0, 8)}`;

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId,
        sellerId,
        totalAmount,
        shippingFee: dto.shippingFee,
        recipientName: dto.recipientName,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        postalCode: dto.postalCode,
        courier: dto.courier,
        status: OrderStatus.PENDING,
        items: {
          create: dto.items.map((item) => {
            return {
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            };
          }),
        },
      },
      include: { items: true },
    });

    const snapItems = dto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      return {
        id: String(item.productId),
        name: product.name.substring(0, 50),
        price: Number(product.price),
        quantity: item.quantity,
      };
    });
    if (dto.shippingFee > 0) {
      snapItems.push({
        id: 'SHIPPING',
        name: 'Ongkos Kirim',
        price: dto.shippingFee,
        quantity: 1,
      });
    }

    const snap = await this.midtrans.createSnapToken({
      orderId: orderNumber,
      amount: totalAmount,
      customerName: user.name ?? 'Pelanggan',
      customerEmail: user.email,
      items: snapItems,
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: { snapToken: snap.token },
    });

    return {
      ...order,
      snapToken: snap.token,
      snapRedirectUrl: snap.redirect_url,
    };
  }

  async findAllByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, imageUrls: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, imageUrls: true, price: true } },
          },
        },
        seller: { select: { id: true, name: true, city: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException('Forbidden');
    return order;
  }

  async handleWebhook(notification: Record<string, unknown>) {
    const statusResponse = await this.midtrans.verifyNotification(notification);
    const orderNumber = statusResponse.order_id as string;
    const transactionStatus = statusResponse.transaction_status as string;
    const fraudStatus = statusResponse.fraud_status as string;
    const paymentType = statusResponse.payment_type as string;

    let newStatus: OrderStatus | null = null;

    if (transactionStatus === 'capture') {
      newStatus = fraudStatus === 'challenge' ? OrderStatus.PENDING : OrderStatus.PAID;
    } else if (transactionStatus === 'settlement') {
      newStatus = OrderStatus.PAID;
    } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
      newStatus = OrderStatus.CANCELLED;
    } else if (transactionStatus === 'pending') {
      newStatus = OrderStatus.PENDING;
    }

    if (newStatus) {
      await this.prisma.order.updateMany({
        where: { orderNumber },
        data: { status: newStatus, paymentId: paymentType },
      });
    }

    return { status: 'ok' };
  }
}
