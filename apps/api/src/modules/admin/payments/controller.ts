import type { Request, Response } from 'express';
import { refundPaymentSchema } from '@jhatpat/shared';
import { AppError } from '@/utils/app-error';
import { audit } from '@/utils/audit';
import { clearDashboardCache } from '../dashboard/service';
import * as service from './service';

export async function getPayments(req: Request, res: Response) {
  const tab = (req.query.tab as any) || 'all';
  const status = req.query.status ? String(req.query.status) : undefined;
  const method = req.query.method ? String(req.query.method) : undefined;
  const from = req.query.from ? String(req.query.from) : undefined;
  const to = req.query.to ? String(req.query.to) : undefined;
  const q = req.query.q ? String(req.query.q) : undefined;
  const page = req.query.page ? Number(req.query.page) : 1;
  const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 20;

  const result = await service.listPayments({
    tab,
    status,
    method,
    from,
    to,
    q,
    page,
    pageSize,
  });

  res.json({ data: result });
}

export async function markPaid(req: Request<{ code: string }>, res: Response) {
  const order = await service.markCodPaid(req.params.code);

  if (req.adminId) {
    await audit(req.adminId, 'mark_cod_paid', 'order', req.params.code, {}, req.ip);
  }
  clearDashboardCache();

  res.json({ data: order });
}

export async function refund(req: Request<{ code: string }>, res: Response) {
  const parsed = refundPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Invalid refund input');
  }

  const order = await service.refundPayment(req.params.code, parsed.data.amountPaise);

  if (req.adminId) {
    await audit(
      req.adminId,
      'refund_order',
      'order',
      req.params.code,
      { amountPaise: parsed.data.amountPaise },
      req.ip,
    );
  }
  clearDashboardCache();

  res.json({ data: order });
}

