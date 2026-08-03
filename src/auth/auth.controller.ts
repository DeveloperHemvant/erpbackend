import { Controller, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { Public } from "./public.decorator";
import { RequirePermissions } from "./permissions.decorator";
import { CurrentUser } from "./current-user.decorator";
import type { AuthenticatedUser } from "./current-user.decorator";

@ApiTags("Authentication Portal")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @ApiOperation({ summary: "Authenticate credentials and get user profile scopes" })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post("change-password")
  @RequirePermissions()
  @ApiOperation({ summary: "Change the current user's own password" })
  @ApiResponse({ status: 200, description: "Password changed" })
  @ApiResponse({ status: 401, description: "Current password incorrect" })
  changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: AuthenticatedUser) {
    return this.authService.changePassword(user.userId, dto);
  }
}
