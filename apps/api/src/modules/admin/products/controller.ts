import type { Request, Response } from 'express';
import { bulkProductActionSchema, productImportCommitSchema, productInputSchema } from '@jhatpat/shared';
import { db } from '@/config/db';
import { AppError } from '@/utils/app-error';
import { audit } from '@/utils/audit';
import { clearDashboardCache } from '../dashboard/service';
import * as service from './service';

export async function getProducts(req: Request, res: Response) {
  const page = req.query.page ? Number(req.query.page) : 1;
  const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 20;
  const tab = (req.query.tab as any) || 'all';
  const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
  const search = req.query.search ? String(req.query.search) : undefined;
  const sort = req.query.sort ? String(req.query.sort) : undefined;

  const result = await service.listProducts({
    page,
    pageSize,
    tab,
    categoryId,
    search,
    sort,
  });

  res.json({ data: result });
}

export async function getProduct(req: Request<{ id: string }>, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid product id');
  }

  const product = await service.getProductById(id);
  res.json({ data: product });
}

export async function createProduct(req: Request, res: Response) {
  const parsed = productInputSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Invalid product input');
  }

  const product = await service.createProduct(parsed.data);

  if (req.adminId) {
    await audit(req.adminId, 'create_product', 'product', String(product.id), { name: product.name }, req.ip);
  }
  clearDashboardCache();

  res.status(201).json({ data: product });
}

export async function updateProduct(req: Request<{ id: string }>, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid product id');
  }

  const parsed = productInputSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Invalid product input');
  }

  const product = await service.updateProduct(id, parsed.data);

  if (req.adminId) {
    await audit(req.adminId, 'update_product', 'product', String(id), { name: product.name }, req.ip);
  }
  clearDashboardCache();

  res.json({ data: product });
}

export async function bulkAction(req: Request, res: Response) {
  const parsed = bulkProductActionSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Invalid bulk action input');
  }

  const result = await service.bulkProductAction(parsed.data);

  if (req.adminId) {
    await audit(req.adminId, 'bulk_product_action', 'product', 'batch', parsed.data, req.ip);
  }
  clearDashboardCache();

  res.json({ data: result });
}

export async function deleteProduct(req: Request<{ id: string }>, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid product id');
  }

  await service.deleteProduct(id);

  if (req.adminId) {
    await audit(req.adminId, 'delete_product', 'product', String(id), {}, req.ip);
  }
  clearDashboardCache();

  res.json({ data: { success: true } });
}

export async function exportCsv(req: Request, res: Response) {
  const tab = (req.query.tab as any) || 'all';
  const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
  const search = req.query.search ? String(req.query.search) : undefined;

  const csv = await service.exportProductsCsv({ tab, categoryId, search });

  const filename = `products-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}

export async function quickEditProduct(req: Request<{ id: string }>, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid product id');
  }

  const { stock, pricePaise, mrpPaise, isActive } = req.body;
  const isStaff = req.admin?.role === 'staff';

  const updateData: any = {};
  if (typeof stock === 'number') {
    updateData.stock = Math.max(0, stock);
  }

  // Staff may only change stock
  if (!isStaff) {
    if (typeof pricePaise === 'number') updateData.pricePaise = pricePaise;
    if (typeof mrpPaise === 'number') updateData.mrpPaise = mrpPaise;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
  }

  const updated = await db.product.update({
    where: { id },
    data: updateData,
  });

  await audit(req.adminId!, 'quick_edit', 'product', String(id), updateData, req.ip);
  clearDashboardCache();

  res.json({ data: updated });
}

export async function getImportTemplate(req: Request, res: Response) {
  const csv = service.getImportTemplateCsv();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="product-import-template.csv"');
  res.send(csv);
}

export async function previewImport(req: Request, res: Response) {
  const { csv } = req.body;
  if (!csv || typeof csv !== 'string') {
    throw new AppError(400, 'MISSING_CSV_CONTENT', 'CSV text content is required');
  }

  const result = await service.previewProductImport(csv);
  res.json({ data: result });
}

export async function commitImport(req: Request, res: Response) {
  const parsed = productImportCommitSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Invalid commit payload');
  }

  const result = await service.commitProductImport(parsed.data.items);

  if (req.adminId) {
    await audit(req.adminId, 'import_products', 'product', 'batch', { count: result.count }, req.ip);
  }
  clearDashboardCache();

  res.json({ data: result });
}
