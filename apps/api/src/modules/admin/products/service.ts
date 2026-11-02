import { db } from '@/config/db';
import { AppError } from '@/utils/app-error';
import { generateUniqueProductSlug } from '@/utils/slug';
import type {
  AdminProductDetail,
  AdminProductListItem,
  AdminProductListResponse,
  BulkProductActionInput,
  ProductImportCommitInput,
  ProductImportInvalidItem,
  ProductImportPreviewResponse,
  ProductImportValidItem,
  ProductInput,
} from '@jhatpat/shared';

interface ListProductsParams {
  page?: number;
  pageSize?: number;
  tab?: 'all' | 'active' | 'inactive' | 'low' | 'out';
  categoryId?: number;
  search?: string;
  sort?: string;
}

export async function listProducts(params: ListProductsParams): Promise<AdminProductListResponse> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const tab = params.tab || 'all';

  const setting = await db.storeSetting.findUnique({
    where: { id: 1 },
    select: { lowStockThreshold: true },
  });
  const lowStockThreshold = setting?.lowStockThreshold ?? 10;

  // Base category condition if specified
  let categoryCondition: any = undefined;
  if (params.categoryId) {
    // If category has children, include children ids too
    const children = await db.category.findMany({
      where: { parentId: params.categoryId },
      select: { id: true },
    });
    if (children.length > 0) {
      categoryCondition = { in: [params.categoryId, ...children.map((c) => c.id)] };
    } else {
      categoryCondition = params.categoryId;
    }
  }

  // Search condition
  const searchCondition: any = params.search
    ? {
        OR: [
          { name: { contains: params.search } },
          { slug: { contains: params.search } },
          { category: { name: { contains: params.search } } },
        ],
      }
    : undefined;

  const baseWhere: any = {};
  if (categoryCondition) baseWhere.categoryId = categoryCondition;
  if (searchCondition) Object.assign(baseWhere, searchCondition);

  // Parallel count queries for tabs
  const [allCount, activeCount, inactiveCount, lowCount, outCount] = await Promise.all([
    db.product.count({ where: baseWhere }),
    db.product.count({ where: { ...baseWhere, isActive: true } }),
    db.product.count({ where: { ...baseWhere, isActive: false } }),
    db.product.count({ where: { ...baseWhere, stock: { lte: lowStockThreshold, gt: 0 } } }),
    db.product.count({ where: { ...baseWhere, stock: 0 } }),
  ]);

  const tabCounts = {
    all: allCount,
    active: activeCount,
    inactive: inactiveCount,
    low: lowCount,
    out: outCount,
  };

  const where: any = { ...baseWhere };
  if (tab === 'active') where.isActive = true;
  else if (tab === 'inactive') where.isActive = false;
  else if (tab === 'low') where.stock = { lte: lowStockThreshold, gt: 0 };
  else if (tab === 'out') where.stock = 0;

  let orderBy: any = { updatedAt: 'desc' };
  if (params.sort === 'name_asc') orderBy = { name: 'asc' };
  else if (params.sort === 'price_asc') orderBy = { pricePaise: 'asc' };
  else if (params.sort === 'price_desc') orderBy = { pricePaise: 'desc' };
  else if (params.sort === 'stock_asc') orderBy = { stock: 'asc' };
  else if (params.sort === 'stock_desc') orderBy = { stock: 'desc' };

  const total =
    tab === 'active'
      ? activeCount
      : tab === 'inactive'
        ? inactiveCount
        : tab === 'low'
          ? lowCount
          : tab === 'out'
            ? outCount
            : allCount;

  const skip = (page - 1) * pageSize;

  const products = await db.product.findMany({
    where,
    orderBy,
    skip,
    take: pageSize,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          parent: { select: { name: true } },
        },
      },
      images: {
        orderBy: { sortOrder: 'asc' },
        take: 1,
        select: { url: true },
      },
    },
  });

  const items: AdminProductListItem[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    unit: p.unit,
    subtitle: p.subtitle,
    tag: p.tag,
    mrpPaise: p.mrpPaise,
    pricePaise: p.pricePaise,
    stock: p.stock,
    isActive: p.isActive,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    parentCategoryName: p.category.parent?.name ?? null,
    image: p.images[0]?.url ?? null,
    updatedAt: p.updatedAt.toISOString(),
  }));

  return {
    items,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
    tabCounts,
  };
}

export async function getProductById(id: number): Promise<AdminProductDetail> {
  const p = await db.product.findUnique({
    where: { id },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          parentId: true,
        },
      },
      images: {
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          url: true,
          sortOrder: true,
        },
      },
    },
  });

  if (!p) {
    throw new AppError(404, 'NOT_FOUND', 'Product not found');
  }

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    unit: p.unit,
    subtitle: p.subtitle,
    description: p.description,
    tag: p.tag,
    mrpPaise: p.mrpPaise,
    pricePaise: p.pricePaise,
    stock: p.stock,
    isActive: p.isActive,
    categoryId: p.categoryId,
    category: {
      id: p.category.id,
      name: p.category.name,
      parentId: p.category.parentId,
    },
    images: p.images,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function createProduct(input: ProductInput) {
  const category = await db.category.findUnique({
    where: { id: input.categoryId },
  });
  if (!category) {
    throw new AppError(400, 'CATEGORY_NOT_FOUND', 'Selected category does not exist');
  }

  const slug = await generateUniqueProductSlug(input.slug || input.name);

  const product = await db.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        name: input.name,
        slug,
        categoryId: input.categoryId,
        unit: input.unit,
        subtitle: input.subtitle || '',
        description: input.description || '',
        tag: input.tag || null,
        mrpPaise: input.mrpPaise,
        pricePaise: input.pricePaise,
        stock: input.stock,
        isActive: input.isActive,
      },
    });

    if (input.images.length > 0) {
      await tx.productImage.createMany({
        data: input.images.map((img, index) => ({
          productId: created.id,
          url: img.url,
          sortOrder: index,
        })),
      });
    }

    return created;
  });

  return getProductById(product.id);
}

export async function updateProduct(id: number, input: ProductInput) {
  const existing = await db.product.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Product not found');
  }

  const category = await db.category.findUnique({
    where: { id: input.categoryId },
  });
  if (!category) {
    throw new AppError(400, 'CATEGORY_NOT_FOUND', 'Selected category does not exist');
  }

  const slug = input.slug && input.slug !== existing.slug
    ? await generateUniqueProductSlug(input.slug, id)
    : existing.slug;

  await db.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        name: input.name,
        slug,
        categoryId: input.categoryId,
        unit: input.unit,
        subtitle: input.subtitle || '',
        description: input.description || '',
        tag: input.tag || null,
        mrpPaise: input.mrpPaise,
        pricePaise: input.pricePaise,
        stock: input.stock,
        isActive: input.isActive,
      },
    });

    await tx.productImage.deleteMany({
      where: { productId: id },
    });

    if (input.images.length > 0) {
      await tx.productImage.createMany({
        data: input.images.map((img, index) => ({
          productId: id,
          url: img.url,
          sortOrder: index,
        })),
      });
    }
  });

  return getProductById(id);
}

export async function bulkProductAction(input: BulkProductActionInput) {
  if (input.action === 'activate') {
    const res = await db.product.updateMany({
      where: { id: { in: input.ids } },
      data: { isActive: true },
    });
    return { count: res.count };
  }

  if (input.action === 'deactivate') {
    const res = await db.product.updateMany({
      where: { id: { in: input.ids } },
      data: { isActive: false },
    });
    return { count: res.count };
  }

  if (input.action === 'set_category') {
    if (!input.categoryId) {
      throw new AppError(400, 'CATEGORY_REQUIRED', 'Category is required for set_category action');
    }
    const cat = await db.category.findUnique({ where: { id: input.categoryId } });
    if (!cat) {
      throw new AppError(400, 'CATEGORY_NOT_FOUND', 'Selected category does not exist');
    }
    const res = await db.product.updateMany({
      where: { id: { in: input.ids } },
      data: { categoryId: input.categoryId },
    });
    return { count: res.count };
  }

  throw new AppError(400, 'INVALID_ACTION', 'Unsupported bulk action');
}

export async function deleteProduct(id: number) {
  const existing = await db.product.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Product not found');
  }

  const orderCount = await db.orderItem.count({
    where: { productId: id },
  });

  if (orderCount > 0) {
    throw new AppError(
      409,
      'PRODUCT_HAS_ORDERS',
      'Cannot delete product because it has order history. Deactivate it instead.',
    );
  }

  await db.product.delete({
    where: { id },
  });

  return { success: true };
}

export async function exportProductsCsv(params: {
  tab?: 'all' | 'active' | 'inactive' | 'low' | 'out';
  categoryId?: number;
  search?: string;
}): Promise<string> {
  const list = await listProducts({
    ...params,
    page: 1,
    pageSize: 5000,
  });

  const headers = [
    'ID',
    'Name',
    'Slug',
    'Unit',
    'Category',
    'Parent Category',
    'MRP (INR)',
    'Selling Price (INR)',
    'Discount (%)',
    'Stock',
    'Status',
    'Updated At',
  ];

  const rows = list.items.map((p) => {
    const mrp = (p.mrpPaise / 100).toFixed(2);
    const price = (p.pricePaise / 100).toFixed(2);
    const discount = p.mrpPaise > p.pricePaise
      ? Math.round(((p.mrpPaise - p.pricePaise) / p.mrpPaise) * 100) + '%'
      : '0%';
    const status = p.isActive ? 'Active' : 'Inactive';
    const category = p.categoryName || '';
    const parentCategory = p.parentCategoryName || '';

    const escape = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;

    return [
      p.id,
      escape(p.name),
      escape(p.slug),
      escape(p.unit),
      escape(category),
      escape(parentCategory),
      mrp,
      price,
      discount,
      p.stock,
      status,
      p.updatedAt,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

export function getImportTemplateCsv(): string {
  const headers = [
    'Name',
    'Category',
    'MRP (INR)',
    'Selling Price (INR)',
    'Stock',
    'Unit',
    'Subtitle',
    'Description',
    'Tag',
  ];

  const examples = [
    [
      '"Fresh Alphonso Mango"',
      '"Fruits & Vegetables"',
      '199',
      '149',
      '50',
      '"1 kg"',
      '"Ratnagiri A-grade fresh mangoes"',
      '"Naturally sweet and juicy fresh Alphonso mangoes."',
      '"Fresh"',
    ].join(','),
    [
      '"Whole Wheat Sliced Bread"',
      '"Bakery & Bread"',
      '55',
      '48',
      '30',
      '"400 g"',
      '"Freshly baked stone ground loaf"',
      '"Healthy 100% whole wheat bread without chemical preservatives."',
      '"Healthy"',
    ].join(','),
  ];

  return [headers.join(','), ...examples].join('\r\n');
}

function parseCsv(csvContent: string): string[][] {
  const rows: string[][] = [];
  const lines = csvContent.split(/\r\n|\n|\r/);
  for (const line of lines) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let insideQuote = false;
    let entry = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuote && line[i + 1] === '"') {
          entry += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        row.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim());
    rows.push(row);
  }
  return rows;
}

export async function previewProductImport(csvContent: string): Promise<ProductImportPreviewResponse> {
  const rows = parseCsv(csvContent);
  const headerRow = rows[0];
  if (!headerRow || rows.length < 2) {
    throw new AppError(400, 'INVALID_CSV', 'CSV file must contain a header row and at least one data row');
  }

  const rawHeaders = headerRow.map((h) => h.toLowerCase().trim());
  const nameIdx = rawHeaders.findIndex((h) => h === 'name' || h.includes('product'));
  const categoryIdx = rawHeaders.findIndex((h) => h === 'category');
  const mrpIdx = rawHeaders.findIndex((h) => h.includes('mrp'));
  const priceIdx = rawHeaders.findIndex((h) => h.includes('selling') || h.includes('price'));
  const stockIdx = rawHeaders.findIndex((h) => h === 'stock' || h.includes('qty') || h.includes('quantity'));
  const unitIdx = rawHeaders.findIndex((h) => h === 'unit');
  const subtitleIdx = rawHeaders.findIndex((h) => h.includes('subtitle'));
  const descIdx = rawHeaders.findIndex((h) => h.includes('desc'));
  const tagIdx = rawHeaders.findIndex((h) => h === 'tag');

  if (nameIdx === -1 || categoryIdx === -1 || mrpIdx === -1 || priceIdx === -1 || stockIdx === -1 || unitIdx === -1) {
    throw new AppError(
      400,
      'MISSING_REQUIRED_HEADERS',
      'CSV must have columns for Name, Category, MRP, Selling Price, Stock, and Unit',
    );
  }

  // Pre-fetch all categories to match names
  const allCategories = await db.category.findMany({
    select: { id: true, name: true, parentId: true },
  });

  const categoryMap = new Map<string, { id: number; parentId: number | null }>();
  for (const c of allCategories) {
    categoryMap.set(c.name.toLowerCase().trim(), { id: c.id, parentId: c.parentId });
  }

  const validItems: ProductImportValidItem[] = [];
  const invalidItems: ProductImportInvalidItem[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const rowNumber = i + 1; // 1-based line number in file

    const name = row[nameIdx] || '';
    const categoryName = row[categoryIdx] || '';
    const mrpStr = row[mrpIdx] || '0';
    const priceStr = row[priceIdx] || '0';
    const stockStr = row[stockIdx] || '0';
    const unit = row[unitIdx] || '';
    const subtitle = subtitleIdx !== -1 ? row[subtitleIdx] : undefined;
    const description = descIdx !== -1 ? row[descIdx] : undefined;
    const tag = tagIdx !== -1 ? row[tagIdx] : undefined;

    const errors: string[] = [];

    if (!name || name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    if (!unit || unit.trim().length < 1) {
      errors.push('Unit measurement is required');
    }

    const mrpRupees = parseFloat(mrpStr);
    const priceRupees = parseFloat(priceStr);
    const stock = parseInt(stockStr, 10);

    if (isNaN(mrpRupees) || mrpRupees <= 0) {
      errors.push('MRP must be a valid positive number');
    }

    if (isNaN(priceRupees) || priceRupees <= 0) {
      errors.push('Selling price must be a valid positive number');
    }

    if (!isNaN(mrpRupees) && !isNaN(priceRupees) && priceRupees > mrpRupees) {
      errors.push('Selling price cannot exceed MRP');
    }

    if (isNaN(stock) || stock < 0) {
      errors.push('Stock must be an integer 0 or greater');
    }

    // Category check: match by name
    const matchedCategory = categoryMap.get(categoryName.toLowerCase().trim());
    let categoryId = 0;
    if (!matchedCategory) {
      errors.push(`Category "${categoryName}" does not exist in catalog`);
    } else {
      categoryId = matchedCategory.id;
    }

    if (errors.length > 0) {
      invalidItems.push({
        rowNumber,
        data: { name, categoryName, mrpRupees, priceRupees, stock, unit },
        errors,
      });
    } else {
      const slug = await generateUniqueProductSlug(name);
      validItems.push({
        rowNumber,
        name: name.trim(),
        categoryName: categoryName.trim(),
        categoryId,
        mrpRupees,
        priceRupees,
        mrpPaise: Math.round(mrpRupees * 100),
        pricePaise: Math.round(priceRupees * 100),
        stock,
        unit: unit.trim(),
        subtitle: subtitle?.trim(),
        description: description?.trim(),
        tag: tag?.trim(),
        slug,
      });
    }
  }

  return {
    totalRows: rows.length - 1,
    validCount: validItems.length,
    invalidCount: invalidItems.length,
    validItems,
    invalidItems,
  };
}

export async function commitProductImport(
  items: ProductImportCommitInput['items'],
) {
  const result = await db.$transaction(async (tx) => {
    const created = [];
    for (const item of items) {
      const prod = await tx.product.create({
        data: {
          name: item.name,
          slug: item.slug,
          unit: item.unit,
          subtitle: item.subtitle || '',
          description: item.description || '',
          tag: item.tag || null,
          mrpPaise: item.mrpPaise,
          pricePaise: item.pricePaise,
          stock: item.stock,
          isActive: true,
          categoryId: item.categoryId,
        },
      });
      created.push(prod);
    }
    return created;
  });

  return { count: result.length };
}

