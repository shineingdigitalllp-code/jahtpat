import type { Request, Response } from 'express';
import type { GoogleAuthInput, LoginInput, RegisterInput } from '@jhatpat/shared';
import { clearSession, setSession } from '@/utils/session';
import * as authService from './service';

export async function register(req: Request<object, unknown, RegisterInput>, res: Response) {
  const user = await authService.register(req.body);
  setSession(res, user.id);
  res.status(201).json({ data: user });
}

export async function login(req: Request<object, unknown, LoginInput>, res: Response) {
  const user = await authService.login(req.body);
  setSession(res, user.id);
  res.json({ data: user });
}

export async function google(req: Request<object, unknown, GoogleAuthInput>, res: Response) {
  const user = await authService.loginWithGoogle(req.body.idToken);
  setSession(res, user.id);
  res.json({ data: user });
}

export function logout(_req: Request, res: Response) {
  clearSession(res);
  res.status(204).end();
}

export async function me(req: Request, res: Response) {
  res.json({ data: await authService.getUser(req.userId!) });
}
