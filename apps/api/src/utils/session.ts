import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env, IS_PROD } from '@/config/env';

const COOKIE_NAME = 'token';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const COOKIE_OPTIONS = { httpOnly: true, sameSite: 'lax', secure: IS_PROD, path: '/' } as const;

export function setSession(res: Response, userId: string) {
  const token = jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: MAX_AGE_MS / 1000 });
  res.cookie(COOKIE_NAME, token, { ...COOKIE_OPTIONS, maxAge: MAX_AGE_MS });
}

export function clearSession(res: Response) {
  res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
}

export function readSession(req: Request): string | null {
  const token: unknown = req.cookies?.[COOKIE_NAME];
  if (typeof token !== 'string') return null;
  try {
    const { sub } = jwt.verify(token, env.JWT_SECRET);
    return typeof sub === 'string' ? sub : null;
  } catch {
    return null;
  }
}
