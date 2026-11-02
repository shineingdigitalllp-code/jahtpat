import type { Category, CategoryDetail, HomeData, ProductCard, ProductDetail, ProductFilters, ProductPage, ProductSort } from '@jhatpat/shared';
import type { Prisma } from '@/generated/prisma/client';
import { db } from '@/config/db';
import { AppError } from '@/utils/app-error';

const categorySelect = { id: true, name: true, slug: true, image: true } as const;
export const bannerSelect = { id: true, title: true, subtitle: true, ctaLabel: true, image: true, link: true } as const;
export const productSelect = {
  id: true,
  slug: true,
  name: true,
  subtitle: true,
  unit: true,
  tag: true,
  ratingAvg: true,
  ratingCount: true,
  pricePaise: true,
  mrpPaise: true,
  images: { select: { url: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
} as const satisfies Prisma.ProductSelect;

const SORT_ORDER: Record<ProductSort, Prisma.ProductOrderByWithRelationInput[]> = {
  popular: [{ ratingCount: 'desc' }, { id: 'asc' }],
  price_asc: [{ pricePaise: 'asc' }, { id: 'asc' }],
  price_desc: [{ pricePaise: 'desc' }, { id: 'asc' }],
  rating: [{ ratingAvg: 'desc' }, { id: 'asc' }],
};

type ProductRow = Prisma.ProductGetPayload<{ select: typeof productSelect }>;

export const toCard = ({ images, ...product }: ProductRow): ProductCard => ({ ...product, image: images[0]?.url ?? null });

export async function getHome(): Promise<HomeData> {
  const now = new Date();
  const [banners, categories, discounted, bestSellers, topRated, freshPicks, coupons] = await Promise.all([
    db.banner.findMany({ where: { isActive: true, categoryId: null, placement: 'home' }, orderBy: { sortOrder: 'asc' }, select: bannerSelect }),
    db.category.findMany({ where: { isActive: true, parentId: null }, orderBy: { sortOrder: 'asc' }, select: categorySelect }),
    db.product.findMany({
      where: { isActive: true, stock: { gt: 0 }, pricePaise: { lt: db.product.fields.mrpPaise } },
      select: productSelect,
    }),
    db.category.findMany({
      where: { isActive: true, featured: true, parent: { isActive: true } },
      orderBy: { sortOrder: 'asc' },
      select: { ...categorySelect, parent: { select: { slug: true } } },
    }),
    db.product.findMany({
      where: { isActive: true, stock: { gt: 0 } },
      orderBy: [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }],
      take: 10,
      select: productSelect,
    }),
    db.product.findMany({
      where: { isActive: true, stock: { gt: 0 }, tag: { in: ['Fresh', 'Organic'] } },
      orderBy: { ratingCount: 'desc' },
      take: 6,
      select: productSelect,
    }),
    db.coupon.findMany({
      where: { isActive: true, validFrom: { lte: now }, validTo: { gte: now } },
      orderBy: { sortOrder: 'asc' },
      take: 6,
      select: {
        id: true,
        code: true,
        title: true,
        subtitle: true,
        image: true,
        category: true,
        type: true,
        value: true,
        minOrderPaise: true,
        maxDiscountPaise: true,
      },
    }),
  ]);

  const deals = discounted
    .map(toCard)
    .sort((a, b) => b.mrpPaise / b.pricePaise - a.mrpPaise / a.pricePaise)
    .slice(0, 10);

  return {
    banners,
    categories,
    deals,
    bestSellers: bestSellers.map(({ parent, ...category }) => ({ ...category, parentSlug: parent?.slug ?? category.slug })),
    topRated: topRated.map(toCard),
    freshPicks: freshPicks.map(toCard),
    coupons,
  };
}

export function listCategories(): Promise<Category[]> {
  return db.category.findMany({ where: { isActive: true, parentId: null }, orderBy: { sortOrder: 'asc' }, select: categorySelect });
}

export async function getCategory(slug: string): Promise<CategoryDetail> {
  const category = await db.category.findFirst({
    where: { slug, isActive: true, parentId: null },
    select: {
      ...categorySelect,
      children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: categorySelect },
      banners: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 1, select: bannerSelect },
    },
  });
  if (!category) throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
  const { children, banners, ...rest } = category;
  return { category: rest, children, banner: banners[0] ?? null };
}

export async function listProducts({ category, q, sort, tag, minRating, cursor, limit }: ProductFilters): Promise<ProductPage> {
  const rows = await db.product.findMany({
    where: {
      isActive: true,
      ...(category && { category: { OR: [{ slug: category }, { parent: { slug: category } }] } }),
      ...(q && { name: { contains: q } }),
      ...(tag && { tag }),
      ...(minRating && { ratingAvg: { gte: minRating } }),
    },
    orderBy: SORT_ORDER[sort],
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: productSelect,
  });
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map(toCard);
  return { items, nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null };
}

export async function getProduct(slug: string): Promise<ProductDetail> {
  const product = await db.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { select: { url: true }, orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!product) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');

  const similar = await db.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isActive: true,
      stock: { gt: 0 },
    },
    take: 6,
    select: productSelect,
  });

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    subtitle: product.subtitle,
    description: product.description,
    unit: product.unit,
    tag: product.tag,
    ratingAvg: product.ratingAvg,
    ratingCount: product.ratingCount,
    pricePaise: product.pricePaise,
    mrpPaise: product.mrpPaise,
    stock: product.stock,
    images: product.images.length > 0 ? product.images.map((img) => img.url) : [],
    category: product.category,
    similarProducts: similar.map(toCard),
  };
}
