"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginInput } from "@jhatpat/shared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthSubmit } from "@/hooks/use-auth";
import { PasswordToggle } from "./PasswordToggle";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { submit, formError } = useAuthSubmit("/auth/login");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-3">
      <Input
        label="Mobile number or email"
        hideLabel
        icon={Mail}
        iconColor="blue"
        placeholder="Enter your mobile number or email"
        autoComplete="username"
        error={errors.identifier?.message}
        {...register("identifier")}
      />
      <Input
        label="Password"
        hideLabel
        icon={LockKeyhole}
        type={showPassword ? "text" : "password"}
        placeholder="Enter your password"
        autoComplete="current-password"
        error={errors.password?.message}
        trailing={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />}
        {...register("password")}
      />
      <Link href="/forgot-password" className="-mt-1 self-end py-1 text-sm font-semibold text-neutral-800 hover:text-black">
        Forgot Password?
      </Link>
      {formError && (
        <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {formError}
        </p>
      )}
      <Button type="submit" size="lg" pending={isSubmitting} className="w-full">
        Login
        {!isSubmitting && <ArrowRight aria-hidden className="size-5" />}
      </Button>
    </form>
  );
}
