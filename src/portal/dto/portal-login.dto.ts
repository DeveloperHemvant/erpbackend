import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PortalLoginDto {
  @ApiProperty({ description: 'Portal username, email, or admission number' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'Portal password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
