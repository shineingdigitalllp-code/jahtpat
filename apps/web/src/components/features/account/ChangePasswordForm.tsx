"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { changePasswordSchema } from "@jhatpat/shared";
import { PasswordToggle } from "@/components/features/auth/PasswordToggle";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiSend, ApiError } from "@/lib/api";

const formSchema = changePasswordSchema
  .extend({ confirmPassword: z.string() })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type PasswordValues = z.infer<typeof formSchema>;

export function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({ resolver: zodResolver(formSchema) });
  const type = visible ? "text" : "password";
  const toggle = <PasswordToggle visible={visible} onToggle={() => setVisible((value) => !value)} />;

  const submit = async ({ currentPassword, newPassword }: PasswordValues) => {
    setFormError(null);
    if (hasPassword && !currentPassword) {
      setError("currentPassword", { message: "Enter your current password" });
      return;
    }
    try {
      await apiSend("/account/password", "POST", { currentPassword, newPassword });
      router.replace("/account/settings");
    } catch (error) {
      if (error instanceof ApiError && error.code === "INVALID_PASSWORD") {
        setError("currentPassword", { message: error.message });
      } else {
        setFormError(error instanceof ApiError ? error.message : "Something went wrong. Please try again.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-3 px-4">
      {hasPassword && (
        <Input
          label="Current Password"
          icon={LockKeyhole}
          type={type}
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          trailing={toggle}
          {...register("currentPassword")}
        />
      )}
      <Input
        label="New Password"
        icon={LockKeyhole}
        iconColor="orange"
        type={type}
        placeholder="Minimum 8 characters"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        trailing={hasPassword ? undefined : toggle}
        {...register("newPassword")}
      />
      <Input
        label="Confirm New Password"
        icon={LockKeyhole}
        iconColor="orange"
        type={type}
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      {formError && (
        <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {formError}
        </p>
      )}
      <Button type="submit" size="lg" pending={isSubmitting} className="mt-2 w-full">
        {hasPassword ? "Update Password" : "Set Password"}
      </Button>
    </form>
  );
}
