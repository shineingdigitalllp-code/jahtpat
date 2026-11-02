import type { Request, Response } from 'express';
import * as service from './service';

export async function search(req: Request, res: Response) {
  const q = req.query.q ? String(req.query.q) : '';
  const result = await service.searchAdmin(q);
  res.json({ data: result });
}

