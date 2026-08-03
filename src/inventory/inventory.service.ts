import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

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
    return this.prisma.asset.findMany({ where, include: { category: true, campus: true } });
  }

  async createRequisition(data: any) {
    return this.prisma.purchaseRequisition.create({ data });
  }

  async getRequisitions(campusId?: string) {
    const where = campusId ? { campusId } : {};
    return this.prisma.purchaseRequisition.findMany({ where, include: { campus: true } });
  }
}
