import {
  BadRequestException,
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
import { RequirePermissions } from '../auth/permissions.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

// Class-level MANAGE_ACADEMICS default -- matches the mobile Inventory tile
// (modules.tsx id 'a5-inv'), which already expects MANAGE_ACADEMICS and was
// silently failing every call since this controller had zero decorators.
@RequirePermissions('MANAGE_ACADEMICS')
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
  async addAsset(
    @Body() data: CreateAssetDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const campusId = data.campusId || user.campusId;
    if (!campusId) {
      throw new BadRequestException(
        'campusId is required: select a campus before adding an asset.',
      );
    }
    return this.inventoryService.addAsset({ ...data, campusId });
  }

  @Get('assets')
  @ApiOperation({ summary: 'Get Assets' })
  async getAssets(@Query('campusId') campusId?: string) {
    return this.inventoryService.getAssets(campusId);
  }

  @Post('requisitions')
  @ApiOperation({ summary: 'Create Purchase Requisition' })
  async createRequisition(
    @Body() data: CreatePurchaseRequisitionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // Campus-fixed staff (the overwhelming majority of requisition raisers)
    // never need to know or send their own campus id - it's already on
    // their JWT. Previously this was a required client-supplied field with
    // no fallback, which is why the mobile app resorted to guessing one
    // from whatever asset/requisition happened to already be loaded.
    const campusId = data.campusId || user.campusId;
    if (!campusId) {
      throw new BadRequestException(
        'campusId is required: select a campus before raising a requisition.',
      );
    }
    return this.inventoryService.createRequisition({ ...data, campusId });
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
