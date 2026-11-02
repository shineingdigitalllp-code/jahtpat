import type { Request, Response } from 'express';
import * as service from './service';

export async function getAnalytics(req: Request, res: Response) {
  const { from, to, groupBy } = req.query as {
    from?: string;
    to?: string;
    groupBy?: 'day' | 'week' | 'month';
  };

  const data = await service.getAnalyticsData({ from, to, groupBy });
  res.json({ data });
}

export async function exportCsv(req: Request, res: Response) {
  const { panel = 'revenue', from, to, groupBy } = req.query as {
    panel?: string;
    from?: string;
    to?: string;
    groupBy?: 'day' | 'week' | 'month';
  };

  const csv = await service.exportAnalyticsCsv(panel, { from, to, groupBy });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="analytics-${panel}.csv"`);
  res.send(csv);
}

