import type { Metadata } from "next";
import type { AccountSummary } from "@jhatpat/shared";
import { ProfileForm } from "@/components/features/account/ProfileForm";
import { LoginPrompt } from "@/components/features/auth/LoginPrompt";
import { TitleHeader } from "@/components/layout/TitleHeader";
import { getAuthed } from "@/lib/server-api";

export const metadata: Metadata = { title: "Edit Profile" };

export default async function ProfilePage() {
  const summary = await getAuthed<AccountSummary>("/account/summary");

  return (
    <>
      <TitleHeader title="Edit Profile" back />
      {summary ? (
        <ProfileForm user={summary.user} />
      ) : (
        <LoginPrompt message="Log in to edit your profile." next="/account/profile" />
      )}
    </>
  );
}
