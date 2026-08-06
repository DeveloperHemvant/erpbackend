import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique({
      where: { name: createRoleDto.name },
    });
    if (existing) {
      throw new ConflictException(
        `Role with name "${createRoleDto.name}" already exists.`,
      );
    }

    return this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        description: createRoleDto.description,
        permissions: createRoleDto.permissions,
        status: createRoleDto.status || 'Active',
        createdBy: createRoleDto.createdBy || 'SYSTEM',
      },
    });
  }

  async findAll() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        staff: {
          select: { id: true, email: true, fullName: true, status: true },
        },
      },
    });
    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found.`);
    }
    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    await this.findOne(id); // Throws 404 if not found

    if (updateRoleDto.name) {
      const existing = await this.prisma.role.findFirst({
        where: {
          name: updateRoleDto.name,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictException(
          `Another role with name "${updateRoleDto.name}" already exists.`,
        );
      }
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        name: updateRoleDto.name,
        description: updateRoleDto.description,
        permissions: updateRoleDto.permissions,
        status: updateRoleDto.status,
        updatedBy: updateRoleDto.updatedBy || 'SYSTEM',
      },
    });
  }

  async remove(id: string) {
    const role = await this.findOne(id);
    if (role.staff.length > 0) {
      throw new ConflictException(
        `Cannot delete role with assigned staff members. Relocate staff first.`,
      );
    }

    return this.prisma.role.delete({
      where: { id },
    });
  }
}
