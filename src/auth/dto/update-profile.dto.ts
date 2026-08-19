import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class NotificationPreferencesDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  smsAlerts?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  dailyDigest?: boolean;
}

export class UpdateMyProfileDto {
  @ApiPropertyOptional()
  @IsString()
  @MinLength(1)
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ type: NotificationPreferencesDto })
  @IsOptional()
  notificationPreferences?: NotificationPreferencesDto;
}
