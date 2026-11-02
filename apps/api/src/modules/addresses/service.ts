import type { Address, AddressInput } from '@jhatpat/shared';
import { db } from '@/config/db';
import { AppError } from '@/utils/app-error';

const MAX_ADDRESSES = 10;

const addressSelect = {
  id: true,
  label: true,
  line1: true,
  line2: true,
  city: true,
  state: true,
  pincode: true,
  isDefault: true,
} as const;

export function listAddresses(userId: string): Promise<Address[]> {
  return db.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
    select: addressSelect,
  });
}

async function findOwned(userId: string, id: string) {
  const address = await db.address.findFirst({ where: { id, userId }, select: { id: true, isDefault: true } });
  if (!address) throw new AppError(404, 'ADDRESS_NOT_FOUND', 'Address not found');
  return address;
}

export async function createAddress(userId: string, input: AddressInput): Promise<Address> {
  const count = await db.address.count({ where: { userId } });
  if (count >= MAX_ADDRESSES) throw new AppError(422, 'ADDRESS_LIMIT', `You can save up to ${MAX_ADDRESSES} addresses`);
  const isDefault = input.isDefault || count === 0;

  return db.$transaction(async (tx) => {
    if (isDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    return tx.address.create({ data: { ...input, isDefault, userId }, select: addressSelect });
  });
}

export async function updateAddress(userId: string, id: string, input: AddressInput): Promise<Address> {
  const current = await findOwned(userId, id);
  const isDefault = input.isDefault || current.isDefault;

  return db.$transaction(async (tx) => {
    if (isDefault) await tx.address.updateMany({ where: { userId, id: { not: id } }, data: { isDefault: false } });
    return tx.address.update({ where: { id }, data: { ...input, isDefault }, select: addressSelect });
  });
}

export async function setDefaultAddress(userId: string, id: string): Promise<void> {
  await findOwned(userId, id);
  await db.$transaction([
    db.address.updateMany({ where: { userId }, data: { isDefault: false } }),
    db.address.update({ where: { id }, data: { isDefault: true } }),
  ]);
}

export async function deleteAddress(userId: string, id: string): Promise<void> {
  const address = await findOwned(userId, id);
  const used = await db.order.count({ where: { addressId: id } });
  if (used > 0) throw new AppError(409, 'ADDRESS_IN_USE', 'This address is linked to past orders and cannot be deleted');

  await db.address.delete({ where: { id } });
  if (address.isDefault) {
    const next = await db.address.findFirst({ where: { userId }, select: { id: true } });
    if (next) await db.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
}
