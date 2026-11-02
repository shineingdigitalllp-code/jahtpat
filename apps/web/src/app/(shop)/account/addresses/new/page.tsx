import type { Metadata } from "next";
import { AddressForm } from "@/components/features/account/AddressForm";
import { TitleHeader } from "@/components/layout/TitleHeader";
import { safePath } from "@/lib/utils";

export const metadata: Metadata = { title: "Add Address" };

type NewAddressPageProps = { searchParams: Promise<{ next?: string; locate?: string }> };

export default async function NewAddressPage({ searchParams }: NewAddressPageProps) {
  const { next, locate } = await searchParams;

  return (
    <>
      <TitleHeader title="Add Address" back />
      <AddressForm next={safePath(next, "/account/addresses")} autoLocate={locate === "1"} />
    </>
  );
}
