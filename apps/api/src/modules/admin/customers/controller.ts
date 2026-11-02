import type { Request, Response } from 'express';
import { customerBlockSchema, walletAdjustmentSchema } from '@jhatpat/shared';
import { AppError } from '@/utils/app-error';
import { audit } from '@/utils/audit';
import * as service from './service';

export async function getCustomers(req: Request, res: Response) {
  const q = req.query.q ? String(req.query.q) : undefined;
  const blocked = req.query.blocked !== undefined ? req.query.blocked === 'true' : undefined;
  const sort = req.query.sort ? String(req.query.sort) : undefined;
  const page = req.query.page ? Number(req.query.page) : 1;
  const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 20;

  const result = await service.listCustomers({ q, blocked, sort, page, pageSize });
  res.json({ data: result });
}

export async function getCustomer(req: Request<{ id: string }>, res: Response) {
  const customer = await service.getCustomerById(req.params.id);
  res.json({ data: customer });
}

export async function blockCustomer(req: Request<{ id: string }>, res: Response) {
  const parsed = customerBlockSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Invalid block payload');
  }

  const updated = await service.blockCustomer(req.params.id, parsed.data.blocked);

  if (req.adminId) {
    await audit(
      req.adminId,
      parsed.data.blocked ? 'block_customer' : 'unblock_customer',
      'customer',
      req.params.id,
      { isBlocked: parsed.data.blocked },
      req.ip,
    );
  }

  res.json({ data: updated });
}

export async function adjustWallet(req: Request<{ id: string }>, res: Response) {
  const parsed = walletAdjustmentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Invalid wallet adjustment payload');
  }

  if (!req.adminId) {
    throw new AppError(401, 'UNAUTHORIZED', 'Admin session required');
  }

  const result = await service.adjustWalletBalance(
    req.params.id,
    req.adminId,
    parsed.data.amountPaise,
    parsed.data.reason,
  );

  await audit(
    req.adminId,
    'adjust_wallet',
    'customer',
    req.params.id,
    { amountPaise: parsed.data.amountPaise, reason: parsed.data.reason },
    req.ip,
  );

  res.json({ data: result });
}

