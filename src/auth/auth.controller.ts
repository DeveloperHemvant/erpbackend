import { Controller, Post, Get, Patch, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateMyProfileDto } from './dto/update-profile.dto';
import { Public } from './public.decorator';
import { RequirePermissions } from './permissions.decorator';
import { CurrentUser } from './current-user.decorator';
import type { AuthenticatedUser } from './current-user.decorator';

@ApiTags('Authentication Portal')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Tighter than the global default (100/min) — login is the one endpoint
  // that's both unauthenticated and a brute-force target, so it gets its
  // own stricter throttle instead of relying on the general API limit.
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @ApiOperation({
    summary: 'Authenticate credentials and get user profile scopes',
  })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('change-password')
  @RequirePermissions()
  @ApiOperation({ summary: "Change the current user's own password" })
  @ApiResponse({ status: 200, description: 'Password changed' })
  @ApiResponse({ status: 401, description: 'Current password incorrect' })
  changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.authService.changePassword(user.userId, dto);
  }

  @Get('me/profile')
  @RequirePermissions()
  @ApiOperation({ summary: "Get the current user's own profile settings" })
  getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMyProfile(user.userId);
  }

  @Patch('me/profile')
  @RequirePermissions()
  @ApiOperation({ summary: "Update the current user's own profile settings" })
  updateMyProfile(
    @Body() dto: UpdateMyProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.authService.updateMyProfile(user.userId, dto);
  }
}
