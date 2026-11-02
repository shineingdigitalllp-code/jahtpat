import { db } from '@/config/db';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function generateUniqueProductSlug(name: string, excludeId?: number): Promise<string> {
  const baseSlug = slugify(name) || 'product';
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || (excludeId && existing.id === excludeId)) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export async function generateUniqueCategorySlug(name: string, excludeId?: number): Promise<string> {
  const baseSlug = slugify(name) || 'category';
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.category.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || (excludeId && existing.id === excludeId)) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

