import type { Metadata } from "next";
import type { Address } from "@jhatpat/shared";
import { AddressList } from "@/components/features/account/AddressList";
import { LoginPrompt } from "@/components/features/auth/LoginPrompt";
import { TitleHeader } from "@/components/layout/TitleHeader";
import { getAuthed } from "@/lib/server-api";
import { safePath } from "@/lib/utils";

export const metadata: Metadata = { title: "Saved Addresses" };

type AddressesPageProps = { searchParams: Promise<{ next?: string }> };

export default async function AddressesPage({ searchParams }: AddressesPageProps) {
  const { next } = await searchParams;
  const addresses = await getAuthed<Address[]>("/addresses");

  return (
    <>
      <TitleHeader title={next ? "Select Address" : "Saved Addresses"} back />
      {addresses ? (
        <AddressList initialAddresses={addresses} next={next ? safePath(next, "/checkout") : null} />
      ) : (
        <LoginPrompt message="Log in to manage your delivery addresses." next="/account/addresses" />
      )}
    </>
  );
}
