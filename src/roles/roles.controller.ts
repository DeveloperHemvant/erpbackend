import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PERMISSION_CATALOG } from '../auth/permissions.catalog';

@ApiTags('Role Settings')
@RequirePermissions('MANAGE_ROLES')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // Must stay above @Get(':id') so Nest doesn't match "permissions" as an :id.
  @Get('permissions/catalog')
  @ApiOperation({ summary: 'List every permission string the backend enforces, grouped by module' })
  getPermissionCatalog() {
    return PERMISSION_CATALOG;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new security role' })
  @ApiResponse({ status: 201, description: 'Role registered successfully' })
  @ApiResponse({ status: 409, description: 'Role name already exists' })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all registered roles' })
  @ApiResponse({
    status: 200,
    description: 'List of roles retrieved successfully',
  })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find role profile details by UUID' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Target role UUID' })
  @ApiResponse({ status: 200, description: 'Role profile found' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update role details / permission scopes' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete role by UUID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete role with active staff assigned',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.remove(id);
  }
}
