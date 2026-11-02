import type { Request, Response } from 'express';
import * as service from './service';

export async function getActivity(req: Request, res: Response) {
  const entity = req.query.entity ? String(req.query.entity) : undefined;
  const adminId = req.query.adminId ? String(req.query.adminId) : undefined;
  const from = req.query.from ? String(req.query.from) : undefined;
  const to = req.query.to ? String(req.query.to) : undefined;
  const page = req.query.page ? Number(req.query.page) : 1;
  const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 20;

  const result = await service.listActivity({
    entity,
    adminId,
    from,
    to,
    page,
    pageSize,
  });

  res.json({ data: result });
}

