import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import type { LoginInput, RegisterInput, User } from '@jhatpat/shared';
import { db } from '@/config/db';
import { env } from '@/config/env';
import { AppError } from '@/utils/app-error';

const userSelect = { id: true, name: true, mobile: true, email: true } as const;
const googleClient = new OAuth2Client();

export async function register({ name, mobile, email, password }: RegisterInput): Promise<User> {
  const existing = await db.user.findFirst({
    where: { OR: [{ mobile }, ...(email ? [{ email }] : [])] },
    select: { mobile: true },
  });
  if (existing) {
    throw existing.mobile === mobile
      ? new AppError(409, 'MOBILE_TAKEN', 'An account with this mobile number already exists')
      : new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  return db.user.create({ data: { name, mobile, email, passwordHash }, select: userSelect });
}

export async function login({ identifier, password }: LoginInput): Promise<User> {
  const user = await db.user.findUnique({
    where: identifier.includes('@') ? { email: identifier } : { mobile: identifier },
    select: { ...userSelect, isBlocked: true, passwordHash: true },
  });
  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Incorrect mobile number, email or password');
  }
  if (user.isBlocked) {
    throw new AppError(403, 'ACCOUNT_BLOCKED', 'Your account has been suspended. Please contact support.');
  }
  const { passwordHash: _, isBlocked: __, ...publicUser } = user;
  return publicUser;
}

export async function loginWithGoogle(idToken: string): Promise<User> {
  if (!env.GOOGLE_CLIENT_ID) throw new AppError(503, 'GOOGLE_DISABLED', 'Google sign-in is not available');
  const payload = await googleClient
    .verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID })
    .then((ticket) => ticket.getPayload())
    .catch(() => undefined);
  if (!payload?.email || !payload.email_verified) {
    throw new AppError(401, 'INVALID_GOOGLE_TOKEN', 'Google sign-in failed');
  }
  const { sub: googleId, email, name } = payload;
  const user = await db.user.upsert({
    where: { email },
    update: { googleId },
    create: { googleId, email, name: (name ?? email.split('@')[0] ?? 'User').slice(0, 60) },
    select: { ...userSelect, isBlocked: true },
  });
  if (user.isBlocked) {
    throw new AppError(403, 'ACCOUNT_BLOCKED', 'Your account has been suspended. Please contact support.');
  }
  const { isBlocked: _, ...publicUser } = user;
  return publicUser;
}

export async function getUser(id: string): Promise<User> {
  const user = await db.user.findUnique({ where: { id }, select: { ...userSelect, isBlocked: true } });
  if (!user) throw new AppError(401, 'UNAUTHENTICATED', 'Please log in to continue');
  if (user.isBlocked) {
    throw new AppError(403, 'ACCOUNT_BLOCKED', 'Your account has been suspended. Please contact support.');
  }
  const { isBlocked: _, ...publicUser } = user;
  return publicUser;
}
