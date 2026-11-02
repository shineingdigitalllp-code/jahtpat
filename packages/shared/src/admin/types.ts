export type AdminRole = 'owner' | 'manager' | 'staff';
export type AdminStatus = 'pending' | 'active' | 'suspended';

export interface AdminUserDto {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: AdminStatus;
  mustChangePassword: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminMeDto {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  mustChangePassword: boolean;
}

export interface AdminCounts {
  newOrders: number;
  activeOrders: number;
  lowStock: number;
  pendingAdmins: number;
}

export interface StoreSettingDto {
  id: number;
  storeName: string;
  storePhone: string;
  storeAddress: string;
  isOpen: boolean;
  deliveryFeePaise: number;
  freeDeliveryAbovePaise: number;
  minOrderPaise: number;
  etaMinutes: number;
  lowStockThreshold: number;
  updatedAt: string;
}

export type RangeKey = 'today' | '7d' | '30d' | '90d';

export interface Kpi {
  value: number;
  previous: number;
  deltaPct: number | null;
}

export interface DashboardResponse {
  range: {
    key: RangeKey;
    from: string;
    to: string;
    bucket: 'hour' | 'day';
  };
  kpis: {
    revenuePaise: Kpi;
    orders: Kpi;
    aovPaise: Kpi;
    newCustomers: Kpi;
  };
  ops: {
    avgDeliveryMinutes: number | null;
    cancellationRate: number;
    activeOrders: number;
    lowStockCount: number;
  };
  series: {
    t: string;
    revenuePaise: number;
    orders: number;
  }[];
  statusCounts: Record<string, number>;
  queue: {
    code: string;
    customerName: string;
    itemCount: number;
    totalPaise: number;
    createdAt: string;
  }[];
  lowStock: {
    id: number;
    name: string;
    image: string | null;
    unit: string;
    stock: number;
  }[];
  topProducts: {
    id: number;
    name: string;
    image: string | null;
    units: number;
    revenuePaise: number;
  }[];
  paymentSplit: {
    method: string;
    orders: number;
    revenuePaise: number;
  }[];
  recentOrders: {
    code: string;
    customerName: string;
    itemCount: number;
    totalPaise: number;
    paymentMethod: string;
    paymentStatus: string;
    status: string;
    createdAt: string;
  }[];
}

export interface OrderStatusUpdateInput {
  status: string;
  reason?: string;
  riderName?: string;
  riderPhone?: string;
}

export interface OrderDeliveryUpdateInput {
  riderName: string;
  riderPhone: string;
  etaAt?: string | null;
}

export interface OrderNoteUpdateInput {
  note: string;
}

export interface OrderListItem {
  id: string;
  code: string;
  customerName: string;
  customerMobile: string | null;
  itemCount: number;
  totalPaise: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
}

export interface OrderListResponse {
  items: OrderListItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  statusCounts: Record<string, number>;
}

export interface OrderTimelineStep {
  key: string;
  label: string;
  time?: string | null;
  elapsedMinutes?: number | null;
  completed: boolean;
  current: boolean;
}

export interface OrderDetailItem {
  id: string;
  productId: number;
  name: string;
  unit: string;
  image: string | null;
  qty: number;
  pricePaise: number;
  mrpPaise: number;
  lineTotalPaise: number;
}

export interface OrderActivityEntry {
  id: number;
  action: string;
  adminName: string;
  meta?: any;
  createdAt: string;
}

export interface OrderDetailResponse {
  id: string;
  code: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotalPaise: number;
  discountPaise: number;
  couponCode: string | null;
  couponPaise: number;
  deliveryPaise: number;
  totalPaise: number;
  refundedPaise: number;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  adminNote: string | null;
  createdAt: string;
  preparingAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  riderName: string | null;
  riderPhone: string | null;
  etaAt: string | null;
  user: {
    id: string;
    name: string;
    mobile: string | null;
    email: string | null;
    totalOrdersCount: number;
  };
  address: {
    id: string;
    label: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  items: OrderDetailItem[];
  timeline: OrderTimelineStep[];
  activities: OrderActivityEntry[];
}
export interface AdminProductListItem {
  id: number;
  name: string;
  slug: string;
  unit: string;
  subtitle: string;
  tag: string | null;
  mrpPaise: number;
  pricePaise: number;
  stock: number;
  isActive: boolean;
  categoryId: number;
  categoryName: string;
  parentCategoryName: string | null;
  image: string | null;
  updatedAt: string;
}

export interface AdminProductListResponse {
  items: AdminProductListItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  tabCounts: {
    all: number;
    active: number;
    inactive: number;
    low: number;
    out: number;
  };
}

export interface AdminProductDetail {
  id: number;
  name: string;
  slug: string;
  unit: string;
  subtitle: string;
  description: string;
  tag: string | null;
  mrpPaise: number;
  pricePaise: number;
  stock: number;
  isActive: boolean;
  categoryId: number;
  category: {
    id: number;
    name: string;
    parentId: number | null;
  };
  images: {
    id: number;
    url: string;
    sortOrder: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategoryNode {
  id: number;
  name: string;
  slug: string;
  image: string;
  featured: boolean;
  isActive: boolean;
  sortOrder: number;
  parentId: number | null;
  productCount: number;
  children: AdminCategoryNode[];
}
