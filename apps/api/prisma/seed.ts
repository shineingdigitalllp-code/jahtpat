import bcrypt from 'bcryptjs';
import { db } from '@/config/db';

const img = (file: string) => `/images/catalog/${file}.jpg`;

const IMG = {
  mango: img('mango'),
  dragonFruit: img('dragon-fruit'),
  lime: img('lime'),
  blueberries: img('blueberries'),
  apples: img('apples'),
  oranges: img('oranges'),
  strawberries: img('strawberries'),
  banana: img('banana'),
  pineapple: img('pineapple'),
  kiwi: img('kiwi'),
  grapes: img('grapes'),
  pomegranate: img('pomegranate'),
  broccoli: img('broccoli'),
  tomatoes: img('tomatoes'),
  spinach: img('spinach'),
  herbs: img('herbs'),
  milk: img('milk'),
  bread: img('bread'),
  eggs: img('eggs'),
  chips: img('chips'),
  dryFruits: img('dry-fruits'),
  fruitBasket: img('fruit-basket'),
  oil: img('oil'),
  rice: img('rice'),
  soap: img('soap'),
  chicken: img('chicken'),
  detergent: img('detergent'),
  juice: img('juice'),
  noodles: img('noodles'),
  groceries: img('groceries'),
  gift: img('gift'),
};

type ProductSeed = {
  name: string;
  unit: string;
  subtitle: string;
  tag?: string;
  price: number;
  mrp: number;
  rating: number;
  reviews: number;
  image: string;
};

type CategorySeed = {
  name: string;
  slug: string;
  image: string;
  featured?: boolean;
  products: ProductSeed[];
};

const CATALOG: { name: string; slug: string; image: string; banner?: { title: string; subtitle: string; image: string }; children: CategorySeed[] }[] = [
  {
    name: 'Fruits & Vegetables',
    slug: 'fruits-vegetables',
    image: IMG.apples,
    banner: { title: 'Eat Fresh, Stay Healthy.', subtitle: '100% organic & handpicked fruits for your healthy life.', image: IMG.fruitBasket },
    children: [
      {
        name: 'Mango',
        slug: 'mango',
        image: IMG.mango,
        products: [
          { name: 'Alphonso Mango', unit: '1 kg', subtitle: 'Sweet, juicy & premium quality', tag: 'Organic', price: 149, mrp: 189, rating: 4.8, reviews: 210, image: IMG.mango },
        ],
      },
      {
        name: 'Citrus',
        slug: 'citrus',
        image: IMG.oranges,
        products: [
          { name: 'Lime (Kagzi)', unit: '250 g', subtitle: 'Tangy, fresh & full of vitamin C', tag: 'Organic', price: 29, mrp: 39, rating: 4.7, reviews: 120, image: IMG.lime },
          { name: 'Nagpur Orange', unit: '1 kg', subtitle: 'Sweet and easy to peel', tag: 'Fresh', price: 99, mrp: 120, rating: 4.5, reviews: 86, image: IMG.oranges },
        ],
      },
      {
        name: 'Berries',
        slug: 'berries',
        image: IMG.blueberries,
        products: [
          { name: 'Blueberries', unit: '125 g', subtitle: 'Packed with antioxidants', tag: 'Fresh', price: 249, mrp: 299, rating: 4.9, reviews: 150, image: IMG.blueberries },
          { name: 'Strawberries', unit: '200 g', subtitle: 'Mahabaleshwar, ripe & red', tag: 'Fresh', price: 89, mrp: 110, rating: 4.6, reviews: 98, image: IMG.strawberries },
        ],
      },
      {
        name: 'Apples',
        slug: 'apples',
        image: IMG.apples,
        products: [
          { name: 'Shimla Apple', unit: '1 kg', subtitle: 'Crisp, sweet & crunchy', tag: 'Organic', price: 179, mrp: 220, rating: 4.6, reviews: 312, image: IMG.apples },
        ],
      },
      {
        name: 'Exotics',
        slug: 'exotics',
        image: IMG.dragonFruit,
        products: [
          { name: 'Dragon Fruit', unit: '1 pc', subtitle: 'Rich in fibre & antioxidants', tag: 'Fresh', price: 99, mrp: 120, rating: 4.6, reviews: 98, image: IMG.dragonFruit },
          { name: 'Kiwi', unit: '3 pcs', subtitle: 'Tangy and loaded with vitamin C', tag: 'Fresh', price: 79, mrp: 99, rating: 4.4, reviews: 64, image: IMG.kiwi },
        ],
      },
      {
        name: 'Tropical',
        slug: 'tropical',
        image: IMG.pineapple,
        products: [
          { name: 'Pineapple', unit: '1 pc', subtitle: 'Juicy, sweet & tangy', price: 69, mrp: 85, rating: 4.3, reviews: 57, image: IMG.pineapple },
          { name: 'Robusta Banana', unit: '6 pcs', subtitle: 'Naturally ripened', tag: 'Organic', price: 45, mrp: 55, rating: 4.5, reviews: 401, image: IMG.banana },
          { name: 'Pomegranate', unit: '500 g', subtitle: 'Bhagwa, deep red arils', price: 119, mrp: 150, rating: 4.6, reviews: 140, image: IMG.pomegranate },
          { name: 'Green Grapes', unit: '500 g', subtitle: 'Seedless and sweet', tag: 'Fresh', price: 69, mrp: 89, rating: 4.4, reviews: 77, image: IMG.grapes },
        ],
      },
      {
        name: 'Vegetables',
        slug: 'vegetables',
        image: IMG.broccoli,
        products: [
          { name: 'Broccoli', unit: '250 g', subtitle: 'Farm fresh green florets', tag: 'Organic', price: 59, mrp: 75, rating: 4.5, reviews: 88, image: IMG.broccoli },
          { name: 'Desi Tomato', unit: '1 kg', subtitle: 'Ripe and tangy', tag: 'Fresh', price: 35, mrp: 45, rating: 4.3, reviews: 520, image: IMG.tomatoes },
          { name: 'Spinach (Palak)', unit: '250 g', subtitle: 'Tender leaves, cleaned', tag: 'Organic', price: 25, mrp: 30, rating: 4.4, reviews: 210, image: IMG.spinach },
        ],
      },
      {
        name: 'Herbs',
        slug: 'herbs',
        image: IMG.herbs,
        products: [
          { name: 'Mint Leaves', unit: '100 g', subtitle: 'Fresh and aromatic', tag: 'Fresh', price: 15, mrp: 20, rating: 4.5, reviews: 132, image: IMG.herbs },
        ],
      },
    ],
  },
  {
    name: 'Dairy & Bakery',
    slug: 'dairy-bakery',
    image: IMG.milk,
    children: [
      {
        name: 'Milk',
        slug: 'milk',
        image: IMG.milk,
        products: [
          { name: 'Toned Milk', unit: '1 L', subtitle: 'Pasteurised, fresh daily', price: 56, mrp: 56, rating: 4.7, reviews: 980, image: IMG.milk },
        ],
      },
      {
        name: 'Bread & Buns',
        slug: 'bread-buns',
        image: IMG.bread,
        products: [
          { name: 'Sourdough Bread', unit: '400 g', subtitle: 'Baked this morning', price: 120, mrp: 140, rating: 4.6, reviews: 75, image: IMG.bread },
        ],
      },
    ],
  },
  {
    name: 'Snacks & Beverages',
    slug: 'snacks-beverages',
    image: IMG.chips,
    children: [
      {
        name: 'Chips & Namkeen',
        slug: 'chips-namkeen',
        image: IMG.chips,
        products: [
          { name: 'Salted Potato Chips', unit: '150 g', subtitle: 'Classic and crunchy', price: 45, mrp: 50, rating: 4.3, reviews: 260, image: IMG.chips },
          { name: 'Premium Dry Fruits Mix', unit: '500 g', subtitle: 'Almonds, cashews & raisins', price: 599, mrp: 799, rating: 4.7, reviews: 188, image: IMG.dryFruits },
          { name: 'Fresh Fruit Hamper', unit: '1.5 kg', subtitle: 'Seasonal fruits, gift packed', price: 499, mrp: 599, rating: 4.6, reviews: 54, image: IMG.fruitBasket },
        ],
      },
      {
        name: 'Juices & Drinks',
        slug: 'juices-drinks',
        image: IMG.juice,
        featured: true,
        products: [
          { name: 'Cold Pressed Orange Juice', unit: '250 ml', subtitle: 'No added sugar', price: 99, mrp: 120, rating: 4.4, reviews: 66, image: IMG.juice },
        ],
      },
      {
        name: 'Instant Food',
        slug: 'instant-food',
        image: IMG.noodles,
        featured: true,
        products: [
          { name: 'Masala Noodles', unit: '4 x 70 g', subtitle: 'Ready in 2 minutes', price: 56, mrp: 60, rating: 4.5, reviews: 840, image: IMG.noodles },
        ],
      },
    ],
  },
  {
    name: 'Staples',
    slug: 'staples',
    image: IMG.rice,
    children: [
      {
        name: 'Oil, Ghee & Masala',
        slug: 'oil-ghee-masala',
        image: IMG.oil,
        featured: true,
        products: [
          { name: 'Cold Pressed Groundnut Oil', unit: '1 L', subtitle: 'Wood pressed, unrefined', price: 289, mrp: 340, rating: 4.6, reviews: 143, image: IMG.oil },
        ],
      },
      {
        name: 'Rice & Atta',
        slug: 'rice-atta',
        image: IMG.rice,
        featured: true,
        products: [
          { name: 'Basmati Rice', unit: '5 kg', subtitle: 'Long grain, aged 1 year', price: 649, mrp: 799, rating: 4.5, reviews: 412, image: IMG.rice },
        ],
      },
    ],
  },
  {
    name: 'Personal Care',
    slug: 'personal-care',
    image: IMG.soap,
    children: [
      {
        name: 'Bath & Body',
        slug: 'bath-body',
        image: IMG.soap,
        products: [
          { name: 'Handmade Neem Soap', unit: '3 x 100 g', subtitle: 'Gentle, natural ingredients', price: 180, mrp: 225, rating: 4.4, reviews: 92, image: IMG.soap },
        ],
      },
    ],
  },
  {
    name: 'Household',
    slug: 'household',
    image: IMG.detergent,
    children: [
      {
        name: 'Cleaning',
        slug: 'cleaning',
        image: IMG.detergent,
        featured: true,
        products: [
          { name: 'Liquid Detergent', unit: '1 L', subtitle: 'Tough on stains, gentle on clothes', price: 199, mrp: 249, rating: 4.3, reviews: 205, image: IMG.detergent },
        ],
      },
    ],
  },
  {
    name: 'Meat & Eggs',
    slug: 'meat-eggs',
    image: IMG.eggs,
    children: [
      {
        name: 'Eggs',
        slug: 'eggs',
        image: IMG.eggs,
        products: [
          { name: 'Farm Fresh Eggs', unit: '12 pcs', subtitle: 'Protein rich, white eggs', price: 89, mrp: 96, rating: 4.6, reviews: 630, image: IMG.eggs },
        ],
      },
      {
        name: 'Chicken',
        slug: 'chicken',
        image: IMG.chicken,
        products: [
          { name: 'Chicken Curry Cut', unit: '500 g', subtitle: 'Antibiotic residue free', price: 189, mrp: 220, rating: 4.4, reviews: 318, image: IMG.chicken },
        ],
      },
    ],
  },
];

const HOME_BANNERS = [
  { title: 'Festive Delights Delivered to You', subtitle: 'Celebrate with premium quality and best offers', image: IMG.gift, link: '/categories/snacks-beverages' },
  { title: 'Fresh From the Farm', subtitle: 'Handpicked fruits & vegetables every morning', image: IMG.groceries, link: '/categories/fruits-vegetables' },
  { title: 'Daily Staples, Best Prices', subtitle: 'Rice, atta, oil & more at everyday low prices', image: IMG.rice, link: '/categories/staples' },
];

const OFFER_BANNERS = [
  { title: 'Fresh Groceries Big Savings', subtitle: 'Use code JHATPAT', image: IMG.groceries, link: '/categories/fruits-vegetables' },
  { title: 'Combo Deals', subtitle: 'Up to 30% OFF', image: IMG.fruitBasket, link: '/categories/snacks-beverages' },
  { title: 'Brand Offers', subtitle: 'Up to 50% OFF', image: IMG.detergent, link: '/categories/household' },
];

const DAY_MS = 24 * 60 * 60 * 1000;

const COUPONS = [
  { code: 'JHATPAT20', title: 'Flat 20% OFF', subtitle: 'on your first order', type: 'percent', value: 20, minOrderPaise: 0, maxDiscountPaise: 15000, image: IMG.fruitBasket, category: 'general' },
  { code: 'JHATPATFD', title: 'Free Delivery', subtitle: 'on orders above ₹299', type: 'free_delivery', value: 0, minOrderPaise: 29900, image: IMG.groceries, category: 'general' },
  { code: 'SAVE100', title: '₹100 OFF', subtitle: 'on orders above ₹499', type: 'flat', value: 10000, minOrderPaise: 49900, image: IMG.rice, category: 'general' },
  { code: 'HDFC10', title: '10% Instant Discount', subtitle: 'with HDFC Bank cards', type: 'percent', value: 10, minOrderPaise: 39900, maxDiscountPaise: 10000, image: IMG.oil, category: 'bank' },
  { code: 'WALLET50', title: '₹50 Cashback', subtitle: 'when you pay with wallet', type: 'flat', value: 5000, minOrderPaise: 29900, image: IMG.juice, category: 'wallet' },
  { code: 'COMBO15', title: '15% OFF Combos', subtitle: 'on fruit & veg combos', type: 'percent', value: 15, minOrderPaise: 19900, maxDiscountPaise: 7500, image: IMG.broccoli, category: 'combo' },
] as const;

const DEMO_USER = { name: 'Amit Sharma', mobile: '9876543210', email: 'amit.sharma@example.com', password: 'demo1234' };
const DEMO_ADMIN = {
  name: 'Abhishek Tyagi',
  email: 'admin@jhatpat.com',
  password: 'abcd123456',
  role: 'owner' as const,
  status: 'active' as const,
};

const DEMO_ORDERS = [
  { code: 'JP785421', minutesAgo: 25, status: 'out_for_delivery', items: [['robusta-banana', 2], ['toned-milk', 2], ['desi-tomato', 2], ['spinach-palak', 2]] },
  { code: 'JP762309', minutesAgo: 17 * 24 * 60, status: 'delivered', items: [['farm-fresh-eggs', 1], ['spinach-palak', 2], ['masala-noodles', 1], ['cold-pressed-groundnut-oil', 2]] },
  { code: 'JP748201', minutesAgo: 21 * 24 * 60, status: 'delivered', items: [['shimla-apple', 1], ['mint-leaves', 2], ['sourdough-bread', 1], ['nagpur-orange', 1]] },
] as const;

async function seedDemoAccount() {
  const user = await db.user.upsert({
    where: { mobile: DEMO_USER.mobile },
    update: { walletPaise: 25000 },
    create: {
      name: DEMO_USER.name,
      mobile: DEMO_USER.mobile,
      email: DEMO_USER.email,
      passwordHash: await bcrypt.hash(DEMO_USER.password, 12),
      walletPaise: 25000,
    },
  });
  await db.address.deleteMany({ where: { userId: user.id } });
  const address = await db.address.create({
    data: { userId: user.id, label: 'Home', line1: '12, Talwandi', city: 'Kota', state: 'Rajasthan', pincode: '324005', isDefault: true },
  });
  await db.address.create({
    data: { userId: user.id, label: 'Work', line1: 'Indraprastha Industrial Area', city: 'Kota', state: 'Rajasthan', pincode: '324005' },
  });

  for (const order of DEMO_ORDERS) {
    const products = await db.product.findMany({ where: { slug: { in: order.items.map(([slug]) => slug) } } });
    const lines = order.items.flatMap(([slug, qty]) => {
      const product = products.find((p) => p.slug === slug);
      return product ? [{ product, qty }] : [];
    });
    const subtotalPaise = lines.reduce((sum, { product, qty }) => sum + product.mrpPaise * qty, 0);
    const totalItemsPaise = lines.reduce((sum, { product, qty }) => sum + product.pricePaise * qty, 0);
    const placedAt = new Date(Date.now() - order.minutesAgo * 60_000);
    const at = (minutes: number) => new Date(placedAt.getTime() + minutes * 60_000);
    const delivered = order.status === 'delivered';

    await db.order.create({
      data: {
        code: order.code,
        userId: user.id,
        addressId: address.id,
        status: order.status,
        paymentMethod: 'upi',
        paymentStatus: 'paid',
        subtotalPaise,
        discountPaise: subtotalPaise - totalItemsPaise,
        deliveryPaise: 0,
        totalPaise: totalItemsPaise,
        createdAt: placedAt,
        preparingAt: at(5),
        outForDeliveryAt: at(25),
        deliveredAt: delivered ? at(38) : null,
        riderName: delivered ? null : 'Rohit Kumar',
        riderPhone: delivered ? null : '9123456780',
        etaAt: delivered ? null : at(33),
        items: {
          create: lines.map(({ product, qty }) => ({
            productId: product.id,
            name: product.name,
            unit: product.unit,
            qty,
            pricePaise: product.pricePaise,
            mrpPaise: product.mrpPaise,
          })),
        },
      },
    });
  }
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function main() {
  await db.$transaction([
    db.orderItem.deleteMany(),
    db.order.deleteMany(),
    db.coupon.deleteMany(),
    db.cartItem.deleteMany(),
    db.wishlist.deleteMany(),
    db.productImage.deleteMany(),
    db.product.deleteMany(),
    db.banner.deleteMany(),
    db.category.deleteMany({ where: { parentId: { not: null } } }),
    db.category.deleteMany(),
  ]);

  for (const [index, parent] of CATALOG.entries()) {
    const { id: parentId } = await db.category.create({
      data: { name: parent.name, slug: parent.slug, image: parent.image, sortOrder: index },
    });
    if (parent.banner) {
      await db.banner.create({ data: { ...parent.banner, categoryId: parentId, link: `/categories/${parent.slug}` } });
    }
    for (const [childIndex, child] of parent.children.entries()) {
      const { id: categoryId } = await db.category.create({
        data: { name: child.name, slug: child.slug, image: child.image, featured: child.featured ?? false, sortOrder: childIndex, parentId },
      });
      for (const product of child.products) {
        await db.product.create({
          data: {
            categoryId,
            name: product.name,
            slug: slugify(product.name),
            unit: product.unit,
            subtitle: product.subtitle,
            description: `${product.name} — ${product.subtitle.toLowerCase()}. Delivered fresh from our Kota store.`,
            tag: product.tag,
            ratingAvg: product.rating,
            ratingCount: product.reviews,
            pricePaise: product.price * 100,
            mrpPaise: product.mrp * 100,
            stock: 100,
            images: { create: [{ url: product.image }] },
          },
        });
      }
    }
  }

  await db.banner.createMany({ data: HOME_BANNERS.map((banner, sortOrder) => ({ ...banner, sortOrder })) });
  await db.banner.createMany({
    data: OFFER_BANNERS.map((banner, sortOrder) => ({ ...banner, sortOrder, placement: 'offers' as const })),
  });
  await db.coupon.createMany({
    data: COUPONS.map((coupon, sortOrder) => ({
      ...coupon,
      sortOrder,
      validFrom: new Date(Date.now() - DAY_MS),
      validTo: new Date(Date.now() + 365 * DAY_MS),
    })),
  });
  await seedDemoAccount();
  await db.adminUser.upsert({
    where: { email: DEMO_ADMIN.email },
    update: {
      name: DEMO_ADMIN.name,
      role: DEMO_ADMIN.role,
      status: DEMO_ADMIN.status,
    },
    create: {
      name: DEMO_ADMIN.name,
      email: DEMO_ADMIN.email,
      passwordHash: await bcrypt.hash(DEMO_ADMIN.password, 12),
      role: DEMO_ADMIN.role,
      status: DEMO_ADMIN.status,
      mustChangePassword: false,
    },
  });
  await db.storeSetting.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      name: 'Jhatpat',
      phone: '+919876543210',
      address: 'Shop 12, Main Market, Kota, Rajasthan',
      isOpen: true,
      etaMinutes: 10,
      deliveryFeePaise: 2000,
      freeDeliveryAbovePaise: 19900,
      minOrderPaise: 0,
      lowStockThreshold: 10,
    },
    update: {},
  });
}

main().finally(() => db.$disconnect());
