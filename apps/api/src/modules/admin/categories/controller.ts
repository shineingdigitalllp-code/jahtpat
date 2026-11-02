import type { Request, Response } from 'express';
import { categoryInputSchema, reorderCategorySchema } from '@jhatpat/shared';
import { AppError } from '@/utils/app-error';
import { audit } from '@/utils/audit';
import * as service from './service';

export async function getCategories(req: Request, res: Response) {
  const tree = await service.listCategoriesTree();
  res.json({ data: tree });
}

export async function getCategory(req: Request<{ id: string }>, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid category id');
  }

  const category = await service.getCategoryById(id);
  res.json({ data: category });
}

export async function createCategory(req: Request, res: Response) {
  const parsed = categoryInputSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Invalid category input');
  }

  const category = await service.createCategory(parsed.data);

  if (req.adminId) {
    await audit(req.adminId, 'create_category', 'category', String(category.id), { name: category.name }, req.ip);
  }

  res.status(201).json({ data: category });
}

export async function updateCategory(req: Request<{ id: string }>, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid category id');
  }

  const parsed = categoryInputSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Invalid category input');
  }

  const category = await service.updateCategory(id, parsed.data);

  if (req.adminId) {
    await audit(req.adminId, 'update_category', 'category', String(id), { name: category.name }, req.ip);
  }

  res.json({ data: category });
}

export async function reorderCategories(req: Request, res: Response) {
  const parsed = reorderCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid reorder data');
  }

  const result = await service.reorderCategories(parsed.data);

  if (req.adminId) {
    await audit(req.adminId, 'reorder_categories', 'category', 'batch', { count: parsed.data.items.length }, req.ip);
  }

  res.json({ data: result });
}

export async function deleteCategory(req: Request<{ id: string }>, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid category id');
  }

  await service.deleteCategory(id);

  if (req.adminId) {
    await audit(req.adminId, 'delete_category', 'category', String(id), {}, req.ip);
  }

  res.json({ data: { success: true } });
}

