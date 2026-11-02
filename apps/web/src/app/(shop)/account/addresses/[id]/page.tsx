import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Address } from "@jhatpat/shared";
import { AddressForm } from "@/components/features/account/AddressForm";
import { LoginPrompt } from "@/components/features/auth/LoginPrompt";
import { TitleHeader } from "@/components/layout/TitleHeader";
import { getAuthed } from "@/lib/server-api";
import { safePath } from "@/lib/utils";

export const metadata: Metadata = { title: "Edit Address" };

type EditAddressPageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ next?: string }> };

export default async function EditAddressPage({ params, searchParams }: EditAddressPageProps) {
  const [{ id }, { next }, addresses] = await Promise.all([params, searchParams, getAuthed<Address[]>("/addresses")]);
  const address = addresses?.find((item) => item.id === id);
  if (addresses && !address) notFound();

  return (
    <>
      <TitleHeader title="Edit Address" back />
      {address ? (
        <AddressForm address={address} next={safePath(next, "/account/addresses")} />
      ) : (
        <LoginPrompt message="Log in to manage your delivery addresses." next="/account/addresses" />
      )}
    </>
  );
}
