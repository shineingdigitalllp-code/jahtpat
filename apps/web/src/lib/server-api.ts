import { cookies } from "next/headers";
import { api, ApiError } from "./api";

export async function getAuthed<T>(path: string): Promise<T | null> {
  const cookie = (await cookies()).toString();
  return api<T>(path, { headers: { cookie }, cache: "no-store" }).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  });
}
