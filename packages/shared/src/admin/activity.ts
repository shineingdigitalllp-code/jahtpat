export interface AdminActivityItem {
  id: number;
  adminId: string;
  adminName: string;
  adminEmail: string;
  action: string;
  entity: string;
  entityId: string;
  meta: any;
  ip: string | null;
  createdAt: string;
}

export interface AdminActivityResponse {
  items: AdminActivityItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

