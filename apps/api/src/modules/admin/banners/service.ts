import type { AdminBannerListItem, BannerInput, ReorderBannerInput } from '@jhatpat/shared';
import { db } from '@/config/db';
import { AppError } from '@/utils/app-error';

export async function listBanners(placement?: 'home' | 'offers' | 'category'): Promise<AdminBannerListItem[]> {
  const where: any = {};
  if (placement === 'home') {
    where.placement = 'home';
    where.categoryId = null;
  } else if (placement === 'offers') {
    where.placement = 'offers';
    where.categoryId = null;
  } else if (placement === 'category') {
    where.categoryId = { not: null };
  }

  const banners = await db.banner.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return banners.map((b) => ({
    id: b.id,
    placement: b.placement as any,
    categoryId: b.categoryId,
    categoryName: b.category?.name ?? null,
    title: b.title,
    subtitle: b.subtitle,
    ctaLabel: b.ctaLabel,
    image: b.image,
    link: b.link,
    sortOrder: b.sortOrder,
    isActive: b.isActive,
  }));
}

export async function createBanner(input: BannerInput) {
  let sortOrder = input.sortOrder;
  if (sortOrder === 0) {
    const last = await db.banner.findFirst({
      where: input.categoryId ? { categoryId: input.categoryId } : { placement: input.placement },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    sortOrder = (last?.sortOrder ?? 0) + 1;
  }

  const banner = await db.banner.create({
    data: {
      placement: input.placement,
      categoryId: input.categoryId ?? null,
      title: input.title,
      subtitle: input.subtitle || '',
      ctaLabel: input.ctaLabel || 'Shop Now',
      image: input.image,
      link: input.link,
      sortOrder,
      isActive: input.isActive,
    },
  });

  return banner;
}

export async function updateBanner(id: number, input: BannerInput) {
  const existing = await db.banner.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Banner not found');
  }

  const updated = await db.banner.update({
    where: { id },
    data: {
      placement: input.placement,
      categoryId: input.categoryId ?? null,
      title: input.title,
      subtitle: input.subtitle,
      ctaLabel: input.ctaLabel,
      image: input.image,
      link: input.link,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    },
  });

  return updated;
}

export async function reorderBanners(input: ReorderBannerInput) {
  await db.$transaction(
    input.items.map((item) =>
      db.banner.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      }),
    ),
  );
  return { success: true };
}

export async function deleteBanner(id: number) {
  const existing = await db.banner.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Banner not found');
  }

  await db.banner.delete({ where: { id } });
  return { success: true };
}

