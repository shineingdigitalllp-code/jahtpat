import type { AdminUser } from '@/generated/prisma/client';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      adminId?: string;
      admin?: AdminUser;
    }
  }
}

export {};
