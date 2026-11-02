import { db } from '@/config/db';

export async function audit(
  adminId: string,
  action: string,
  entity: string,
  entityId: string = '',
  meta?: Record<string, unknown> | null,
  ip?: string,
): Promise<void> {
  try {
    // Sanitize meta to never include sensitive keys like password, token, secret
    let cleanMeta: Record<string, unknown> | undefined = undefined;
    if (meta && typeof meta === 'object') {
      cleanMeta = {};
      for (const [key, val] of Object.entries(meta)) {
        if (/password|token|secret|cookie|hash/i.test(key)) {
          continue;
        }
        cleanMeta[key] = val;
      }
    }

    await db.activityLog.create({
      data: {
        adminId,
        action,
        entity,
        entityId: entityId || 'none',
        meta: cleanMeta ? (cleanMeta as any) : undefined,
        ip: ip || null,
      },
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

