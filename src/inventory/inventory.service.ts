import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async createCategory(data: any) {
    return this.prisma.assetCategory.create({ data });
  }

  async getCategories() {
    return this.prisma.assetCategory.findMany();
  }

  async addAsset(data: any) {
    return this.prisma.asset.create({ data });
  }

  async getAssets(campusId?: string) {
    const where = campusId ? { campusId } : {};
    return this.prisma.asset.findMany({
      where,
      include: { category: true, campus: true },
    });
  }

  async createRequisition(data: any) {
    return this.prisma.purchaseRequisition.create({ data });
  }

  async getRequisitions(campusId?: string) {
    const where = campusId ? { campusId } : {};
    return this.prisma.purchaseRequisition.findMany({
      where,
      include: { campus: true },
    });
  }

  async updateRequisitionStatus(id: string, data: { status: string }) {
    return this.prisma.purchaseRequisition.update({
      where: { id },
      data: { status: data.status },
    });
  }

  async updateAssetStatus(
    id: string,
    data: { status?: string; quantity?: number },
  ) {
    const payload: any = {};
    if (data.status !== undefined) payload.status = data.status;
    if (data.quantity !== undefined) payload.quantity = data.quantity;
    if (!Object.keys(payload).length)
      return this.prisma.asset.findUnique({ where: { id } });

    return this.prisma.asset.update({
      where: { id },
      data: payload,
      include: { category: true, campus: true },
    });
  }
}
