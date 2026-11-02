import type { Request, Response } from 'express';
import { storeSettingsSchema } from '@jhatpat/shared';
import { AppError } from '@/utils/app-error';
import { audit } from '@/utils/audit';
import { clearDashboardCache } from '../dashboard/service';
import * as service from './service';

export async function getSettings(req: Request, res: Response) {
  const settings = await service.getStoreSettings();
  res.json({ data: settings });
}

export async function updateSettings(req: Request, res: Response) {
  const parsed = storeSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Invalid store settings');
  }

  const updated = await service.updateStoreSettings(parsed.data);

  if (req.adminId) {
    await audit(req.adminId, 'update_settings', 'store_settings', '1', parsed.data, req.ip);
  }
  clearDashboardCache();

  res.json({ data: updated });
}

