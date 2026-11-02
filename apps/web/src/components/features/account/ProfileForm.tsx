"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { profileSchema, type User } from "@jhatpat/shared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiSend, ApiError } from "@/lib/api";
import { formatMobile } from "@/lib/format";

export function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<z.input<typeof profileSchema>, unknown, z.output<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, email: user.email ?? "" },
  });

  const submit = async (values: z.output<typeof profileSchema>) => {
    setFormError(null);
    try {
      await apiSend<User>("/account/profile", "PATCH", values);
      router.replace("/account");
      router.refresh();
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-3 px-4">
      <div className="flex flex-col items-center py-4">
        <span className="grid size-20 place-items-center rounded-3xl bg-ink text-3xl font-black text-primary shadow-card ring-2 ring-primary">
          {user.name.charAt(0).toUpperCase()}
        </span>
      </div>
      <Input
        label="Full Name"
        icon={UserRound}
        iconColor="orange"
        autoComplete="name"
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        label="Email Address"
        icon={Mail}
        iconColor="blue"
        type="email"
        placeholder="Add your email (optional)"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      {user.mobile && (
        <div>
          <Input label="Mobile Number" icon={Phone} iconColor="green" value={formatMobile(user.mobile)} readOnly disabled />
          <p className="mt-1.5 pl-1 text-xs text-muted">Mobile number is linked to your login and cannot be changed.</p>
        </div>
      )}
      {formError && (
        <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {formError}
        </p>
      )}
      <Button type="submit" size="lg" pending={isSubmitting} disabled={!isDirty} className="mt-2 w-full">
        Save Changes
      </Button>
    </form>
  );
}
