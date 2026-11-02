import type { Request, Response } from 'express';
import { bannerInputSchema, reorderBannerSchema } from '@jhatpat/shared';
import { AppError } from '@/utils/app-error';
import { audit } from '@/utils/audit';
import * as service from './service';

export async function getBanners(req: Request, res: Response) {
  const placement = req.query.placement as any;
  const banners = await service.listBanners(placement);
  res.json({ data: banners });
}

export async function createBanner(req: Request, res: Response) {
  const parsed = bannerInputSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Invalid banner input');
  }

  const banner = await service.createBanner(parsed.data);

  if (req.adminId) {
    await audit(req.adminId, 'create_banner', 'banner', String(banner.id), { title: banner.title }, req.ip);
  }

  res.status(201).json({ data: banner });
}

export async function updateBanner(req: Request<{ id: string }>, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid banner id');
  }

  const parsed = bannerInputSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Invalid banner input');
  }

  const banner = await service.updateBanner(id, parsed.data);

  if (req.adminId) {
    await audit(req.adminId, 'update_banner', 'banner', String(id), { title: banner.title }, req.ip);
  }

  res.json({ data: banner });
}

export async function reorderBanners(req: Request, res: Response) {
  const parsed = reorderBannerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid reorder data');
  }

  const result = await service.reorderBanners(parsed.data);

  if (req.adminId) {
    await audit(req.adminId, 'reorder_banners', 'banner', 'batch', { count: parsed.data.items.length }, req.ip);
  }

  res.json({ data: result });
}

export async function deleteBanner(req: Request<{ id: string }>, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid banner id');
  }

  await service.deleteBanner(id);

  if (req.adminId) {
    await audit(req.adminId, 'delete_banner', 'banner', String(id), {}, req.ip);
  }

  res.json({ data: { success: true } });
}

