import type { AdminSearchResponse } from '@jhatpat/shared';
import { db } from '@/config/db';

export async function searchAdmin(query: string): Promise<AdminSearchResponse> {
  const q = query.trim();
  if (q.length < 2) {
    return { orders: [], products: [], customers: [], categories: [] };
  }

  const [orders, products, customers, categories] = await Promise.all([
    db.order.findMany({
      where: {
        OR: [
          { code: { contains: q } },
          { user: { name: { contains: q } } },
          { user: { mobile: { contains: q } } },
        ],
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
      },
    }),
    db.product.findMany({
      where: {
        OR: [{ name: { contains: q } }, { slug: { contains: q } }],
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
    }),
    db.user.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { mobile: { contains: q } },
          { email: { contains: q } },
        ],
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    }),
    db.category.findMany({
      where: {
        OR: [{ name: { contains: q } }, { slug: { contains: q } }],
      },
      take: 5,
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  return {
    orders: orders.map((o) => ({
      id: o.code,
      title: `Order #${o.code}`,
      subtitle: `${o.user.name} • ₹${o.totalPaise / 100} • ${o.status}`,
      url: `/orders/${o.code}`,
    })),
    products: products.map((p) => ({
      id: p.id,
      title: p.name,
      subtitle: `${p.unit} • ₹${p.pricePaise / 100} • Stock: ${p.stock}`,
      url: `/products/${p.id}`,
    })),
    customers: customers.map((c) => ({
      id: c.id,
      title: c.name,
      subtitle: c.mobile ? `+91 ${c.mobile}` : c.email || 'Customer',
      url: `/customers/${c.id}`,
    })),
    categories: categories.map((cat) => ({
      id: cat.id,
      title: cat.name,
      subtitle: cat.parentId ? 'Subcategory' : 'Parent Department',
      url: cat.parentId ? `/categories/${cat.parentId}` : `/categories`,
    })),
  };
}

