import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({ description: "Administrative identifier", example: "admin@school.com" })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({ description: "Secure password", example: "SuperAdminPassword123!" })
  @IsString()
  @IsNotEmpty()
  password: string;
}
