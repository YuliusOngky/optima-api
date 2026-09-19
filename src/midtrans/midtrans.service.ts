import { Injectable } from '@nestjs/common';
import * as Midtrans from 'midtrans-client';

@Injectable()
export class MidtransService {
  private snap: Midtrans.Snap;
  private coreApi: Midtrans.CoreApi;

  constructor() {
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    this.snap = new Midtrans.Snap({
      isProduction,
      serverKey: process.env.MIDTRANS_SERVER_KEY!,
      clientKey: process.env.MIDTRANS_CLIENT_KEY!,
    });
    this.coreApi = new Midtrans.CoreApi({
      isProduction,
      serverKey: process.env.MIDTRANS_SERVER_KEY!,
      clientKey: process.env.MIDTRANS_CLIENT_KEY!,
    });
  }

  async createSnapToken(params: {
    orderId: string;
    amount: number;
    customerName: string;
    customerEmail: string;
    items: { id: string; name: string; price: number; quantity: number }[];
  }): Promise<{ token: string; redirect_url: string }> {
    const parameter = {
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.amount,
      },
      customer_details: {
        first_name: params.customerName,
        email: params.customerEmail,
      },
      item_details: params.items,
    };
    return this.snap.createTransaction(parameter);
  }

  async verifyNotification(notificationBody: Record<string, unknown>) {
    return this.coreApi.transaction.notification(notificationBody);
  }
}
