import type { Request, Response } from 'express';
import type { RangeKey } from '@jhatpat/shared';
import * as dashboardService from './service';

export async function getDashboard(req: Request, res: Response) {
  const range = (req.query.range as RangeKey) || 'today';
  const data = await dashboardService.getDashboardData(range);
  res.json({ data });
}

