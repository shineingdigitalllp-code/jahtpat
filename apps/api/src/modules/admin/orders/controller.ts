import type { Request, Response } from 'express';
import type {
  OrderDeliveryUpdateInput,
  OrderNoteUpdateInput,
  OrderStatusUpdateInput,
} from '@jhatpat/shared';
import * as orderService from './service';

export async function getOrders(req: Request, res: Response) {
  const result = await orderService.listOrders(req.query as any);
  res.json({ data: result });
}

export async function exportCsv(req: Request, res: Response) {
  const csvData = await orderService.exportOrdersCsv(req.query as any);
  const filename = `orders-${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvData);
}

export async function getDetail(req: Request<{ code: string }>, res: Response) {
  const { code } = req.params;
  const result = await orderService.getOrderDetail(code);
  res.json({ data: result });
}

export async function updateStatus(
  req: Request<{ code: string }, unknown, OrderStatusUpdateInput>,
  res: Response,
) {
  const { code } = req.params;
  const result = await orderService.updateOrderStatus(code, req.body, req.adminId!, req.ip);
  res.json({ data: result });
}

export async function updateDelivery(
  req: Request<{ code: string }, unknown, OrderDeliveryUpdateInput>,
  res: Response,
) {
  const { code } = req.params;
  const result = await orderService.updateOrderDelivery(code, req.body, req.adminId!, req.ip);
  res.json({ data: result });
}

export async function updateNote(
  req: Request<{ code: string }, unknown, OrderNoteUpdateInput>,
  res: Response,
) {
  const { code } = req.params;
  const result = await orderService.updateOrderNote(code, req.body, req.adminId!, req.ip);
  res.json({ data: result });
}
