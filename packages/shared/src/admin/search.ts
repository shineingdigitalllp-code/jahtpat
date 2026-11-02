export interface AdminSearchResultItem {
  id: string | number;
  title: string;
  subtitle: string;
  url: string;
  tag?: string;
}

export interface AdminSearchResponse {
  orders: AdminSearchResultItem[];
  products: AdminSearchResultItem[];
  customers: AdminSearchResultItem[];
  categories: AdminSearchResultItem[];
}

