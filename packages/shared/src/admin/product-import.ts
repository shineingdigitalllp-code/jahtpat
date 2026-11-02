import { z } from 'zod';

export const productImportRowSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  categoryName: z.string().trim().min(1, 'Category name is required'),
  mrpRupees: z.coerce.number().positive('MRP must be positive'),
  priceRupees: z.coerce.number().positive('Selling price must be positive'),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  unit: z.string().trim().min(1, 'Unit is required (e.g. 500 g, 1 kg)'),
  subtitle: z.string().trim().max(160).optional(),
  description: z.string().trim().max(2000).optional(),
  tag: z.string().trim().max(40).optional(),
});

export type ProductImportRow = z.infer<typeof productImportRowSchema>;

export interface ProductImportValidItem extends ProductImportRow {
  rowNumber: number;
  categoryId: number;
  mrpPaise: number;
  pricePaise: number;
  slug: string;
}

export interface ProductImportInvalidItem {
  rowNumber: number;
  data: Record<string, any>;
  errors: string[];
}

export interface ProductImportPreviewResponse {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  validItems: ProductImportValidItem[];
  invalidItems: ProductImportInvalidItem[];
}

export const productImportCommitSchema = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      slug: z.string(),
      unit: z.string(),
      subtitle: z.string().optional(),
      description: z.string().optional(),
      tag: z.string().optional(),
      mrpPaise: z.number().int().positive(),
      pricePaise: z.number().int().positive(),
      stock: z.number().int().min(0),
      categoryId: z.number().int(),
    }),
  ).min(1, 'At least one item must be committed'),
});

export type ProductImportCommitInput = z.infer<typeof productImportCommitSchema>;

