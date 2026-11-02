import { z } from 'zod';

export const productInputSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
    slug: z.string().trim().min(2).max(140).optional(),
    categoryId: z.coerce.number().int().positive('Category is required'),
    unit: z.string().trim().min(1, 'Unit is required').max(30),
    subtitle: z.string().trim().max(80).optional().default(''),
    description: z.string().trim().max(2000).optional().default(''),
    tag: z.string().trim().max(30).nullable().optional(),
    mrpPaise: z.coerce.number().int().positive('MRP must be greater than 0'),
    pricePaise: z.coerce.number().int().positive('Selling price must be greater than 0'),
    stock: z.coerce.number().int().min(0, 'Stock cannot be negative').default(0),
    isActive: z.boolean().default(true),
    images: z
      .array(
        z.object({
          url: z.string().min(1, 'Image URL required'),
        }),
      )
      .min(1, 'At least one image is required')
      .max(8, 'Maximum 8 images allowed'),
  })
  .refine((data) => data.pricePaise <= data.mrpPaise, {
    message: 'Selling price cannot be greater than MRP',
    path: ['pricePaise'],
  });

export type ProductInput = z.infer<typeof productInputSchema>;

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  slug: z.string().trim().min(2).max(80).optional(),
  parentId: z.coerce.number().int().positive().nullable().optional(),
  image: z.string().min(1, 'Category image is required'),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const reorderCategorySchema = z.object({
  items: z.array(
    z.object({
      id: z.number().int(),
      sortOrder: z.number().int(),
    }),
  ),
});

export type ReorderCategoryInput = z.infer<typeof reorderCategorySchema>;

export const bulkProductActionSchema = z.object({
  ids: z.array(z.number().int()).min(1, 'At least one product must be selected'),
  action: z.enum(['activate', 'deactivate', 'set_category']),
  categoryId: z.number().int().optional(),
});

export type BulkProductActionInput = z.infer<typeof bulkProductActionSchema>;

