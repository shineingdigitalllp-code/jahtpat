import type { Request, Response } from 'express';
import type { AdminChangePasswordInput, AdminLoginInput, AdminRegisterInput } from '@jhatpat/shared';
import { clearAdminSession, setAdminSession } from '@/utils/admin-session';
import { audit } from '@/utils/audit';
import * as authService from './service';

export async function setupStatus(_req: Request, res: Response) {
  const data = await authService.getSetupStatus();
  res.json({ data });
}

export async function register(
  req: Request<object, unknown, AdminRegisterInput>,
  res: Response,
) {
  const result = await authService.register(req.body, req.ip);
  if (result.isFirst) {
    setAdminSession(res, result.admin.id, true);
    res.status(201).json({ data: result.admin });
    return;
  }
  res.status(201).json({ data: { status: result.status } });
}

export async function login(
  req: Request<object, unknown, AdminLoginInput>,
  res: Response,
) {
  const admin = await authService.login(req.body, req.ip);
  setAdminSession(res, admin.id, Boolean(req.body.remember));
  res.json({ data: admin });
}

export async function logout(req: Request, res: Response) {
  if (req.adminId) {
    await audit(req.adminId, 'logout', 'admin_user', req.adminId, null, req.ip);
  }
  clearAdminSession(res);
  res.status(204).end();
}

export async function me(req: Request, res: Response) {
  res.json({
    data: {
      id: req.admin!.id,
      name: req.admin!.name,
      email: req.admin!.email,
      role: req.admin!.role,
      mustChangePassword: req.admin!.mustChangePassword,
    },
  });
}

export async function changePassword(
  req: Request<object, unknown, AdminChangePasswordInput>,
  res: Response,
) {
  const result = await authService.changePassword(req.adminId!, req.body, req.ip);
  res.json({ data: result });
}

