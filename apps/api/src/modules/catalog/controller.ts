import type { Request, Response } from 'express';
import type { ProductFilters } from '@jhatpat/shared';
import * as catalogService from './service';

const CACHE_SHORT = 'public, max-age=60, stale-while-revalidate=300';

export async function home(_req: Request, res: Response) {
  res.set('Cache-Control', CACHE_SHORT).json({ data: await catalogService.getHome() });
}

export async function categories(_req: Request, res: Response) {
  res.set('Cache-Control', CACHE_SHORT).json({ data: await catalogService.listCategories() });
}

export async function category(req: Request<{ slug: string }>, res: Response) {
  res.set('Cache-Control', CACHE_SHORT).json({ data: await catalogService.getCategory(req.params.slug) });
}

export async function products(req: Request, res: Response) {
  res.json({ data: await catalogService.listProducts(req.query as unknown as ProductFilters) });
}

export async function product(req: Request<{ slug: string }>, res: Response) {
  res.json({ data: await catalogService.getProduct(req.params.slug) });
}
