import { KeyRound, UserRound } from "lucide-react";
import type { Metadata } from "next";
import { AccountMenuItem } from "@/components/features/account/AccountMenuItem";
import { TitleHeader } from "@/components/layout/TitleHeader";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <TitleHeader title="Settings" back />
      <ul className="mx-4 divide-y overflow-hidden rounded-3xl bg-surface shadow-card">
        <AccountMenuItem
          href="/account/profile"
          icon={UserRound}
          iconBg="bg-primary-soft"
          iconColor="text-ink"
          title="Edit Profile"
          subtitle="Name and email"
        />
        <AccountMenuItem
          href="/account/settings/password"
          icon={KeyRound}
          iconBg="bg-neutral-100"
          iconColor="text-neutral-800"
          title="Password"
          subtitle="Change or set your password"
        />
      </ul>
    </>
  );
}
