import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { AdminTeamMember, UpdateTeamMemberInput } from '@jhatpat/shared';
import { db } from '@/config/db';
import { AppError } from '@/utils/app-error';

export async function listTeam(): Promise<AdminTeamMember[]> {
  const members = await db.adminUser.findMany({
    orderBy: [
      { status: 'asc' }, // 'pending' comes first
      { createdAt: 'desc' },
    ],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      mustChangePassword: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return members.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    role: m.role as any,
    status: m.status as any,
    mustChangePassword: m.mustChangePassword,
    lastLoginAt: m.lastLoginAt ? m.lastLoginAt.toISOString() : null,
    createdAt: m.createdAt.toISOString(),
  }));
}

export async function updateTeamMember(
  id: string,
  currentAdminId: string,
  input: UpdateTeamMemberInput,
) {
  if (id === currentAdminId) {
    throw new AppError(400, 'CANNOT_MODIFY_SELF', 'You cannot change your own role or account status');
  }

  const existing = await db.adminUser.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Team member not found');
  }

  // Guard: at least one active owner must remain
  if (
    existing.role === 'owner' &&
    existing.status === 'active' &&
    ((input.role && input.role !== 'owner') || (input.status && input.status !== 'active'))
  ) {
    const activeOwnerCount = await db.adminUser.count({
      where: { role: 'owner', status: 'active' },
    });
    if (activeOwnerCount <= 1) {
      throw new AppError(
        400,
        'LAST_OWNER',
        'Cannot modify this member because at least one active owner must remain.',
      );
    }
  }

  const updated = await db.adminUser.update({
    where: { id },
    data: {
      ...(input.role ? { role: input.role } : {}),
      ...(input.status ? { status: input.status } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  return updated;
}

export async function deleteTeamMember(id: string) {
  const existing = await db.adminUser.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Team member not found');
  }

  if (existing.status !== 'pending') {
    throw new AppError(400, 'ONLY_PENDING', 'Only pending account requests can be rejected.');
  }

  await db.adminUser.delete({ where: { id } });
  return { success: true };
}

export async function resetTeamMemberPassword(id: string) {
  const existing = await db.adminUser.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Team member not found');
  }

  // Generate 10-character temporary password
  const tempPassword = `Jp!${crypto.randomBytes(5).toString('hex')}`;
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  await db.adminUser.update({
    where: { id },
    data: {
      passwordHash,
      mustChangePassword: true,
    },
  });

  return { tempPassword };
}

