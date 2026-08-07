import { Injectable } from '@nestjs/common';
import 'dotenv/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

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

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  validate(payload: {
    sub: string;
    identifier: string;
    role: string;
    permissions: string[];
  }) {
    return {
      userId: payload.sub,
      identifier: payload.identifier,
      role: payload.role,
      permissions: payload.permissions,
    };
  }
}
