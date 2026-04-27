import { Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { compareSync } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { parseToken, signToken } from '../common/auth';

function inferNameFromEmail(email: string) {
  const local = email.split('@')[0] ?? '';
  const normalized = local.replace(/[._-]+/g, ' ').trim();
  if (!normalized) return null;
  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async login(email: string, password: string) {
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const providedPassword = typeof password === 'string' ? password : '';

    if (!normalizedEmail || !providedPassword) {
      throw new UnauthorizedException('Email atau password tidak valid.');
    }

    let user;
    try {
      user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    } catch (error) {
      this.logger.error(`Gagal mengambil user login untuk ${normalizedEmail}.`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Layanan login sedang bermasalah.');
    }

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Email atau password tidak valid.');
    }

    if (typeof user.password !== 'string' || user.password.trim().length === 0) {
      this.logger.warn(`User ${normalizedEmail} memiliki password hash yang tidak valid.`);
      throw new UnauthorizedException('Email atau password tidak valid.');
    }

    let validPassword = false;
    try {
      validPassword = compareSync(providedPassword, user.password);
    } catch (error) {
      this.logger.error(`Validasi password gagal untuk ${normalizedEmail}.`, error instanceof Error ? error.stack : undefined);
      throw new UnauthorizedException('Email atau password tidak valid.');
    }

    if (!validPassword) {
      throw new UnauthorizedException('Email atau password tidak valid.');
    }

    const safeUser = {
      id_user: user.id_user,
      email: user.email,
      fullName: user.fullName?.trim() || inferNameFromEmail(user.email),
      role: user.role,
      isActive: user.isActive,
    };

    let accessToken: string;
    try {
      accessToken = signToken(safeUser);
    } catch (error) {
      this.logger.error(`Gagal membuat token login untuk ${normalizedEmail}.`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Layanan login sedang bermasalah.');
    }

    return {
      accessToken,
      user: safeUser,
    };
  }

  async me(authorization?: string) {
    const session = parseToken(authorization);
    const user = await this.prisma.user.findUnique({
      where: { id_user: session.id_user },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Sesi tidak aktif.');
    }
    return {
      id_user: user.id_user,
      email: user.email,
      fullName: user.fullName?.trim() || inferNameFromEmail(user.email),
      role: user.role,
      isActive: user.isActive,
    };
  }
}
