import bcrypt from 'bcryptjs';
import type { AccountSummary, ChangePasswordInput, ProfileInput, User, WalletData } from '@jhatpat/shared';
import { db } from '@/config/db';
import { AppError } from '@/utils/app-error';

const unauthenticated = () => new AppError(401, 'UNAUTHENTICATED', 'Please log in to continue');

export async function getSummary(userId: string): Promise<AccountSummary> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      mobile: true,
      email: true,
      walletPaise: true,
      passwordHash: true,
      _count: { select: { addresses: true, orders: true } },
    },
  });
  if (!user) throw unauthenticated();
  const { walletPaise, passwordHash, _count, ...profile } = user;
  return {
    user: profile,
    walletPaise,
    addressCount: _count.addresses,
    orderCount: _count.orders,
    hasPassword: Boolean(passwordHash),
  };
}

export async function updateProfile(userId: string, { name, email }: ProfileInput): Promise<User> {
  if (email) {
    const taken = await db.user.findFirst({ where: { email, id: { not: userId } }, select: { id: true } });
    if (taken) throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
  }
  return db.user.update({
    where: { id: userId },
    data: { name, email },
    select: { id: true, name: true, mobile: true, email: true },
  });
}

export async function changePassword(userId: string, { currentPassword, newPassword }: ChangePasswordInput) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user) throw unauthenticated();
  if (user.passwordHash && !(currentPassword && (await bcrypt.compare(currentPassword, user.passwordHash)))) {
    throw new AppError(400, 'INVALID_PASSWORD', 'Current password is incorrect');
  }
  await db.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } });
}

export async function getWallet(userId: string): Promise<WalletData> {
  const [user, orders] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { walletPaise: true } }),
    db.order.findMany({
      where: { userId, couponCode: { not: null }, status: { notIn: ['pending_payment', 'cancelled'] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, code: true, couponCode: true, couponPaise: true, createdAt: true },
    }),
  ]);
  if (!user) throw unauthenticated();

  const claimed = orders.map((order) => ({
    orderId: order.id,
    orderCode: order.code,
    couponCode: order.couponCode ?? '',
    savedPaise: order.couponPaise,
    claimedAt: order.createdAt.toISOString(),
  }));
  return {
    walletPaise: user.walletPaise,
    totalSavedPaise: claimed.reduce((sum, item) => sum + item.savedPaise, 0),
    claimed,
  };
}
