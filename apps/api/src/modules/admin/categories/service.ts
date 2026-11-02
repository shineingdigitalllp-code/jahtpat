import { db } from '@/config/db';
import { AppError } from '@/utils/app-error';
import { generateUniqueCategorySlug } from '@/utils/slug';
import type { CategoryInput, ReorderCategoryInput } from '@jhatpat/shared';

export async function listCategoriesTree() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: { products: true, children: true },
      },
    },
  });

  const parents = categories.filter((c) => c.parentId === null);
  const children = categories.filter((c) => c.parentId !== null);

  const tree = parents.map((parent) => ({
    id: parent.id,
    name: parent.name,
    slug: parent.slug,
    image: parent.image,
    featured: parent.featured,
    isActive: parent.isActive,
    sortOrder: parent.sortOrder,
    parentId: parent.parentId,
    productCount: parent._count.products,
    children: children
      .filter((child) => child.parentId === parent.id)
      .map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        image: child.image,
        featured: child.featured,
        isActive: child.isActive,
        sortOrder: child.sortOrder,
        parentId: child.parentId,
        productCount: child._count.products,
        children: [],
      })),
  }));

  return tree;
}

export async function getCategoryById(id: number) {
  const cat = await db.category.findUnique({
    where: { id },
    include: {
      parent: {
        select: { id: true, name: true, slug: true },
      },
      children: {
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: { select: { products: true } },
        },
      },
      _count: {
        select: { products: true, children: true },
      },
    },
  });

  if (!cat) {
    throw new AppError(404, 'NOT_FOUND', 'Category not found');
  }

  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    image: cat.image,
    featured: cat.featured,
    isActive: cat.isActive,
    sortOrder: cat.sortOrder,
    parentId: cat.parentId,
    parent: cat.parent,
    productCount: cat._count.products,
    children: cat.children.map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      image: child.image,
      featured: child.featured,
      isActive: child.isActive,
      sortOrder: child.sortOrder,
      parentId: child.parentId,
      productCount: child._count.products,
    })),
  };
}

export async function createCategory(input: CategoryInput) {
  // Check parent depth (max depth 2: parent cannot itself have a parent)
  if (input.parentId) {
    const parent = await db.category.findUnique({
      where: { id: input.parentId },
    });
    if (!parent) {
      throw new AppError(404, 'PARENT_NOT_FOUND', 'Selected parent category does not exist');
    }
    if (parent.parentId !== null) {
      throw new AppError(400, 'MAX_DEPTH_EXCEEDED', 'Subcategories cannot have child categories (max depth is 2)');
    }
  }

  const slug = await generateUniqueCategorySlug(input.slug || input.name);

  // If sortOrder is not provided, place at the end of its group
  let sortOrder = input.sortOrder;
  if (sortOrder === undefined || sortOrder === 0) {
    const lastCategory = await db.category.findFirst({
      where: { parentId: input.parentId ?? null },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    sortOrder = (lastCategory?.sortOrder ?? 0) + 1;
  }

  const category = await db.category.create({
    data: {
      name: input.name,
      slug,
      parentId: input.parentId ?? null,
      image: input.image,
      featured: input.featured ?? false,
      isActive: input.isActive ?? true,
      sortOrder,
    },
  });

  return category;
}

export async function updateCategory(id: number, input: CategoryInput) {
  const existing = await db.category.findUnique({
    where: { id },
    include: { _count: { select: { children: true } } },
  });

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Category not found');
  }

  if (input.parentId) {
    if (input.parentId === id) {
      throw new AppError(400, 'INVALID_PARENT', 'A category cannot be its own parent');
    }
    // If it has children, it cannot become a child itself
    if (existing._count.children > 0) {
      throw new AppError(400, 'CANNOT_NEST', 'A category with subcategories cannot be moved under another category');
    }
    const parent = await db.category.findUnique({
      where: { id: input.parentId },
    });
    if (!parent) {
      throw new AppError(404, 'PARENT_NOT_FOUND', 'Selected parent category does not exist');
    }
    if (parent.parentId !== null) {
      throw new AppError(400, 'MAX_DEPTH_EXCEEDED', 'Subcategories cannot have child categories (max depth is 2)');
    }
  }

  const slug = input.slug && input.slug !== existing.slug
    ? await generateUniqueCategorySlug(input.slug, id)
    : existing.slug;

  const updated = await db.category.update({
    where: { id },
    data: {
      name: input.name,
      slug,
      parentId: input.parentId ?? null,
      image: input.image,
      featured: input.featured,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    },
  });

  return updated;
}

export async function reorderCategories(input: ReorderCategoryInput) {
  await db.$transaction(
    input.items.map((item) =>
      db.category.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      }),
    ),
  );
  return { success: true };
}

export async function deleteCategory(id: number) {
  const category = await db.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          children: true,
          products: true,
        },
      },
    },
  });

  if (!category) {
    throw new AppError(404, 'NOT_FOUND', 'Category not found');
  }

  if (category._count.children > 0) {
    throw new AppError(
      409,
      'CATEGORY_HAS_CHILDREN',
      'Cannot delete category because it has subcategories. Remove or reassign them first.',
    );
  }

  if (category._count.products > 0) {
    throw new AppError(
      409,
      'CATEGORY_HAS_PRODUCTS',
      'Cannot delete category because it has products associated with it. Reassign products first.',
    );
  }

  await db.category.delete({
    where: { id },
  });

  return { success: true };
}

