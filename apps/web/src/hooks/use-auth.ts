import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { User } from "@jhatpat/shared";
import { api, ApiError } from "@/lib/api";
import { safePath } from "@/lib/utils";

export function useAuthSubmit(path: "/auth/login" | "/auth/register") {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async (body: object) => {
    setFormError(null);
    try {
      await api<User>(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      router.replace(safePath(searchParams.get("next"), "/account"));
      router.refresh();
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Something went wrong. Please try again.");
    }
  };

  return { submit, formError, setFormError };
}
