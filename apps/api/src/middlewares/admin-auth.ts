import type { RequestHandler } from 'express';
import type { AdminRole } from '@/generated/prisma/client';
import { db } from '@/config/db';
import { env } from '@/config/env';
import { AppError } from '@/utils/app-error';
import { readAdminSession } from '@/utils/admin-session';

export const originGuard: RequestHandler = (req, _res, next) => {
  const method = req.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return next();
  }

  const originHeader = req.headers.origin;
  if (originHeader) {
    const isAllowed = env.ADMIN_ORIGINS.some(
      (allowed) => allowed === originHeader || allowed === originHeader.replace(/\/$/, ''),
    );
    if (!isAllowed) {
      throw new AppError(403, 'FORBIDDEN', 'Invalid request origin');
    }
  }

  next();
};

export const requireAdmin: RequestHandler = async (req, _res, next) => {
  try {
    const adminId = readAdminSession(req);
    if (!adminId) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Admin session expired or invalid');
    }

    const admin = await db.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Admin user not found');
    }

    if (admin.status === 'pending') {
      throw new AppError(403, 'ACCOUNT_PENDING', 'Your account is waiting for approval by an owner.');
    }

    if (admin.status === 'suspended') {
      throw new AppError(403, 'ACCOUNT_SUSPENDED', 'Your account has been suspended.');
    }

    if (admin.status !== 'active') {
      throw new AppError(403, 'FORBIDDEN', 'Account is not active');
    }

    req.adminId = admin.id;
    req.admin = admin;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (...roles: AdminRole[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.admin) {
      return next(new AppError(401, 'UNAUTHENTICATED', 'Authentication required'));
    }

    if (!roles.includes(req.admin.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action'));
    }

    next();
  };
};

