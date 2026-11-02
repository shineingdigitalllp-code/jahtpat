import type { Metadata } from "next";
import type { AccountSummary } from "@jhatpat/shared";
import { ChangePasswordForm } from "@/components/features/account/ChangePasswordForm";
import { LoginPrompt } from "@/components/features/auth/LoginPrompt";
import { TitleHeader } from "@/components/layout/TitleHeader";
import { getAuthed } from "@/lib/server-api";

export const metadata: Metadata = { title: "Password" };

export default async function PasswordPage() {
  const summary = await getAuthed<AccountSummary>("/account/summary");

  return (
    <>
      <TitleHeader title={summary?.hasPassword === false ? "Set Password" : "Change Password"} back />
      {summary ? (
        <ChangePasswordForm hasPassword={summary.hasPassword} />
      ) : (
        <LoginPrompt message="Log in to manage your password." next="/account/settings/password" />
      )}
    </>
  );
}
