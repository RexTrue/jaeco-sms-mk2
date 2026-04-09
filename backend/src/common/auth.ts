import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import jwt from 'jsonwebtoken';

export type AuthUser = {
  id_user: number;
  email: string;
  role: Role;
};

type JwtPayload = AuthUser & {
  iat?: number;
  exp?: number;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is required.');
  }
  return secret;
}

export function signToken(user: AuthUser): string {
  const expiresIn = process.env.JWT_EXPIRES_IN ?? '8h';
  return jwt.sign(user, getJwtSecret(), {
    expiresIn,
    issuer: 'jaecoo-backend',
    audience: 'jaecoo-frontend',
  });
}

export function parseAccessToken(raw: string): AuthUser {
  try {
    const payload = jwt.verify(raw, getJwtSecret(), {
      issuer: 'jaecoo-backend',
      audience: 'jaecoo-frontend',
    }) as JwtPayload;

    if (!payload?.id_user || !payload?.email || !payload?.role) {
      throw new Error('invalid payload');
    }

    return {
      id_user: payload.id_user,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    throw new UnauthorizedException('Token tidak valid atau kedaluwarsa.');
  }
}

export function parseToken(header?: string): AuthUser {
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedException('Token tidak ditemukan.');
  }

  return parseAccessToken(header.slice(7));
}

export function parseOptionalDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Format tanggal tidak valid.');
  }
  return date;
}
