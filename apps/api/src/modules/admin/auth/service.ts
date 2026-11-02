import bcrypt from 'bcryptjs';
import type { AdminChangePasswordInput, AdminLoginInput, AdminRegisterInput, AdminRole, AdminStatus } from '@jhatpat/shared';
import { db } from '@/config/db';
import { AppError } from '@/utils/app-error';
import { audit } from '@/utils/audit';

interface LockRecord {
  count: number;
  lockedUntil: number;
}

const loginLockoutMap = new Map<string, LockRecord>();

export async function getSetupStatus() {
  const count = await db.adminUser.count();
  return { needsSetup: count === 0 };
}

export type RegisterResult =
  | {
      isFirst: true;
      admin: {
        id: string;
        name: string;
        email: string;
        role: AdminRole;
        status: AdminStatus;
        mustChangePassword: boolean;
      };
    }
  | {
      isFirst: false;
      status: 'pending';
    };

export async function register(input: AdminRegisterInput, ip?: string): Promise<RegisterResult> {
  const count = await db.adminUser.count();
  const isFirst = count === 0;

  const existing = await db.adminUser.findUnique({
    where: { email: input.email.toLowerCase() },
    select: { id: true },
  });

  if (existing) {
    throw new AppError(422, 'VALIDATION_ERROR', 'An account with this email already exists', {
      email: ['An account with this email already exists'],
    });
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  if (isFirst) {
    const admin = await db.adminUser.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        role: 'owner',
        status: 'active',
        mustChangePassword: false,
      },
    });

    await audit(admin.id, 'register_owner', 'admin_user', admin.id, { email: admin.email }, ip);

    return {
      isFirst: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        mustChangePassword: admin.mustChangePassword,
      },
    };
  }

  await db.adminUser.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: 'staff',
      status: 'pending',
      mustChangePassword: false,
    },
  });

  return {
    isFirst: false,
    status: 'pending',
  };
}

export async function login(input: AdminLoginInput, ip?: string) {
  const emailKey = input.email.toLowerCase();
  const lockRecord = loginLockoutMap.get(emailKey);

  if (lockRecord && lockRecord.lockedUntil > Date.now()) {
    const minutesLeft = Math.ceil((lockRecord.lockedUntil - Date.now()) / (60 * 1000));
    throw new AppError(429, 'RATE_LIMITED', `Too many attempts, try again in ${minutesLeft} minutes`);
  }

  const admin = await db.adminUser.findUnique({
    where: { email: emailKey },
  });

  if (!admin || !(await bcrypt.compare(input.password, admin.passwordHash))) {
    const currentAttempts = (lockRecord?.count ?? 0) + 1;
    if (currentAttempts >= 5) {
      loginLockoutMap.set(emailKey, {
        count: currentAttempts,
        lockedUntil: Date.now() + 15 * 60 * 1000,
      });
    } else {
      loginLockoutMap.set(emailKey, {
        count: currentAttempts,
        lockedUntil: 0,
      });
    }
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  loginLockoutMap.delete(emailKey);

  if (admin.status === 'pending') {
    throw new AppError(403, 'ACCOUNT_PENDING', 'Your account is waiting for approval by an owner.');
  }

  if (admin.status === 'suspended') {
    throw new AppError(403, 'ACCOUNT_SUSPENDED', 'Your account has been suspended.');
  }

  await db.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  await audit(admin.id, 'login', 'admin_user', admin.id, null, ip);

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    status: admin.status,
    mustChangePassword: admin.mustChangePassword,
  };
}

export async function changePassword(
  adminId: string,
  input: AdminChangePasswordInput,
  ip?: string,
) {
  const admin = await db.adminUser.findUnique({ where: { id: adminId } });
  if (!admin) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Admin user not found');
  }

  const matches = await bcrypt.compare(input.currentPassword, admin.passwordHash);
  if (!matches) {
    throw new AppError(400, 'INVALID_PASSWORD', 'Current password is incorrect');
  }

  const newHash = await bcrypt.hash(input.newPassword, 12);
  await db.adminUser.update({
    where: { id: adminId },
    data: {
      passwordHash: newHash,
      mustChangePassword: false,
    },
  });

  await audit(adminId, 'change_password', 'admin_user', adminId, null, ip);
  return { success: true };
}
