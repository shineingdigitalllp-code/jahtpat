export interface AnalyticsKpi {
  value: number;
  previous: number;
  deltaPct: number | null;
}

export interface AnalyticsSeriesPoint {
  t: string;
  revenuePaise: number;
  orders: number;
}

export interface HourlyOrderPoint {
  hour: number; // 0..23 IST
  orders: number;
  revenuePaise: number;
}

export interface CategorySalesPoint {
  categoryId: number;
  name: string;
  revenuePaise: number;
  units: number;
  pct: number;
}

export interface TopProductAnalyticsItem {
  id: number;
  name: string;
  unit: string;
  categoryName: string;
  unitsSold: number;
  revenuePaise: number;
}

export interface CustomerCohortPoint {
  t: string;
  newCustomers: number;
  returningCustomers: number;
}

export interface CancellationReasonPoint {
  reason: string;
  count: number;
  pct: number;
}

export interface AdminAnalyticsResponse {
  range: {
    from: string;
    to: string;
    groupBy: 'day' | 'week' | 'month';
  };
  kpis: {
    revenuePaise: AnalyticsKpi;
    orders: AnalyticsKpi;
    aovPaise: AnalyticsKpi;
    totalCustomers: AnalyticsKpi;
  };
  revenueTrend: AnalyticsSeriesPoint[];
  ordersByHour: HourlyOrderPoint[];
  salesByCategory: CategorySalesPoint[];
  topProducts: TopProductAnalyticsItem[];
  customerCohort: CustomerCohortPoint[];
  cancellationReasons: CancellationReasonPoint[];
}

