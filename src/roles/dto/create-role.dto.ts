import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsIn,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Unique name of the role',
    example: 'Registrar Officer',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Optional description outlining access rights',
    example: 'Handles student records admissions',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'List of scopes linked to this role',
    example: ['read:admissions', 'write:admissions'],
  })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @ApiProperty({
    description: 'Active status of the role',
    example: 'Active',
    enum: ['Active', 'Inactive'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['Active', 'Inactive'])
  status?: string;

  @ApiProperty({
    description: 'The actor performing this creation',
    example: 'admin@school.com',
    required: false,
  })
  @IsString()
  @IsOptional()
  createdBy?: string;
}
