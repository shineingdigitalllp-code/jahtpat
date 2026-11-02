"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { registerSchema } from "@jhatpat/shared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthSubmit } from "@/hooks/use-auth";
import { PasswordToggle } from "./PasswordToggle";

const signupSchema = registerSchema.extend({
  acceptTerms: z.boolean().refine(Boolean, "Please accept the terms to continue"),
});

type SignupValues = z.input<typeof signupSchema>;

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { submit, formError } = useAuthSubmit("/auth/register");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues, unknown, z.output<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { acceptTerms: false },
  });

  return (
    <form onSubmit={handleSubmit(({ acceptTerms: _, ...values }) => submit(values))} noValidate className="flex flex-col gap-2.5">
      <Input
        label="Full Name"
        icon={UserRound}
        iconColor="orange"
        placeholder="Enter your full name"
        autoComplete="name"
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        label="Mobile Number"
        icon={Phone}
        iconColor="green"
        type="tel"
        inputMode="numeric"
        maxLength={10}
        placeholder="98765 43210"
        autoComplete="tel-national"
        leading={<span className="text-[0.9375rem] font-medium">+91</span>}
        error={errors.mobile?.message}
        {...register("mobile")}
      />
      <Input
        label="Email Address"
        icon={Mail}
        iconColor="blue"
        type="email"
        placeholder="Enter your email (optional)"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label="Create Password"
        icon={LockKeyhole}
        type={showPassword ? "text" : "password"}
        placeholder="Minimum 8 characters"
        autoComplete="new-password"
        error={errors.password?.message}
        trailing={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />}
        {...register("password")}
      />
      <div>
        <label className="flex cursor-pointer items-center gap-3 py-1 text-[0.8125rem] text-ink/80">
          <span className="relative grid size-6 shrink-0 place-items-center">
            <input
              type="checkbox"
              aria-invalid={errors.acceptTerms ? true : undefined}
              className="peer size-6 cursor-pointer appearance-none rounded-md border-2 border-ink/25 bg-surface transition checked:border-primary checked:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              {...register("acceptTerms")}
            />
            <Check
              aria-hidden
              className="pointer-events-none absolute size-4 text-white opacity-0 peer-checked:opacity-100"
              strokeWidth={3}
            />
          </span>
          <span>
            I agree to the{" "}
            <Link href="/terms" className="font-semibold text-neutral-900 underline">
              Terms &amp; Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-semibold text-neutral-900 underline">
              Privacy Policy
            </Link>
          </span>
        </label>
        {errors.acceptTerms && (
          <p role="alert" className="pl-1 text-xs font-medium text-danger">
            {errors.acceptTerms.message}
          </p>
        )}
      </div>
      {formError && (
        <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {formError}
        </p>
      )}
      <Button type="submit" size="lg" pending={isSubmitting} className="w-full">
        Create Account
        {!isSubmitting && <ArrowRight aria-hidden className="size-5" />}
      </Button>
    </form>
  );
}
