import type { RequestHandler } from 'express';
import { AppError } from '@/utils/app-error';
import { readSession } from '@/utils/session';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const userId = readSession(req);
  if (!userId) throw new AppError(401, 'UNAUTHENTICATED', 'Please log in to continue');
  req.userId = userId;
  next();
};

export const optionalAuth: RequestHandler = (req, _res, next) => {
  req.userId = readSession(req) ?? undefined;
  next();
};
