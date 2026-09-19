import { Module } from '@nestjs/common';
import { SellerDashboardController } from './seller-dashboard.controller';
import { SellerDashboardService } from './seller-dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SellerDashboardController],
  providers: [SellerDashboardService],
})
export class SellerDashboardModule {}
