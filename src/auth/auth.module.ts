import { Module } from '@nestjs/common';
import 'dotenv/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { OwnershipService } from './ownership.service';
import { StudentAccessGuard } from './student-access.guard';
import { SelfOrPermissionGuard } from './self-or-permission.guard';
import { AnyPermissionGuard } from './any-permission.guard';
import { StudentAccessOrPermissionGuard } from './student-access-or-permission.guard';

function requireJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error(
      'JWT_SECRET must be configured before the backend can start.',
    );
  }
  return jwtSecret;
}

const jwtSecret = requireJwtSecret();

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    OwnershipService,
    StudentAccessGuard,
    SelfOrPermissionGuard,
    AnyPermissionGuard,
    StudentAccessOrPermissionGuard,
  ],
  exports: [
    AuthService,
    OwnershipService,
    StudentAccessGuard,
    SelfOrPermissionGuard,
    AnyPermissionGuard,
    StudentAccessOrPermissionGuard,
  ],
})
export class AuthModule {}
