import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Patch,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import {
  CreateAssetCategoryDto,
  CreateAssetDto,
  CreatePurchaseRequisitionDto,
  UpdateAssetDto,
  UpdatePurchaseRequisitionStatusDto,
} from './dto/inventory.dto';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('categories')
  @ApiOperation({ summary: 'Create Category' })
  async createCategory(@Body() data: CreateAssetCategoryDto) {
    return this.inventoryService.createCategory(data);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get Categories' })
  async getCategories() {
    return this.inventoryService.getCategories();
  }

  @Post('assets')
  @ApiOperation({ summary: 'Add Asset' })
  async addAsset(@Body() data: CreateAssetDto) {
    return this.inventoryService.addAsset(data);
  }

  @Get('assets')
  @ApiOperation({ summary: 'Get Assets' })
  async getAssets(@Query('campusId') campusId?: string) {
    return this.inventoryService.getAssets(campusId);
  }

  @Post('requisitions')
  @ApiOperation({ summary: 'Create Purchase Requisition' })
  async createRequisition(@Body() data: CreatePurchaseRequisitionDto) {
    return this.inventoryService.createRequisition(data);
  }

  @Get('requisitions')
  @ApiOperation({ summary: 'Get Requisitions' })
  async getRequisitions(@Query('campusId') campusId?: string) {
    return this.inventoryService.getRequisitions(campusId);
  }

  @Patch('requisitions/:id')
  @ApiOperation({ summary: 'Update Purchase Requisition Status' })
  async updateRequisitionStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdatePurchaseRequisitionStatusDto,
  ) {
    return this.inventoryService.updateRequisitionStatus(id, data);
  }

  @Patch('assets/:id')
  @ApiOperation({ summary: 'Update Asset Status / Quantity' })
  async updateAsset(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateAssetDto,
  ) {
    return this.inventoryService.updateAssetStatus(id, data);
  }
}
