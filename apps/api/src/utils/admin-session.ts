import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env, IS_PROD } from '@/config/env';

const ADMIN_COOKIE_NAME = 'jp_admin';
const ADMIN_COOKIE_PATH = '/api/v1/admin';
const SESSION_12H_MS = 12 * 60 * 60 * 1000;
const SESSION_30D_MS = 30 * 24 * 60 * 60 * 1000;

const COOKIE_BASE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: IS_PROD,
  path: ADMIN_COOKIE_PATH,
} as const;

export function setAdminSession(res: Response, adminId: string, remember: boolean = false) {
  const maxAgeMs = remember ? SESSION_30D_MS : SESSION_12H_MS;
  const token = jwt.sign({ sub: adminId, aud: 'admin' }, env.JWT_SECRET, {
    expiresIn: Math.floor(maxAgeMs / 1000),
  });

  res.cookie(ADMIN_COOKIE_NAME, token, {
    ...COOKIE_BASE_OPTIONS,
    maxAge: maxAgeMs,
  });
}

export function clearAdminSession(res: Response) {
  res.clearCookie(ADMIN_COOKIE_NAME, COOKIE_BASE_OPTIONS);
}

export function readAdminSession(req: Request): string | null {
  const token: unknown = req.cookies?.[ADMIN_COOKIE_NAME];
  if (typeof token !== 'string') return null;

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { audience: 'admin' });
    if (typeof decoded === 'object' && decoded !== null && typeof decoded.sub === 'string') {
      return decoded.sub;
    }
    return null;
  } catch {
    return null;
  }
}

