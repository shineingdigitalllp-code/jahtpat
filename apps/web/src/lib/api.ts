import { API_URL } from "./constants";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

type ApiInit = RequestInit & { next?: { revalidate?: number | false; tags?: string[] } };

export async function api<T>(path: string, init?: ApiInit): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, { credentials: "include", ...init });
    const body = (await res.json().catch(() => null)) as { data?: T; error?: { code: string; message: string } } | null;
    if (!res.ok || !body || body.data === undefined) {
      throw new ApiError(res.status, body?.error?.code ?? "NETWORK", body?.error?.message ?? "Something went wrong");
    }
    return body.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(503, "BACKEND_UNAVAILABLE", `Failed to connect to API server at ${API_URL}`);
  }
}

export const apiSend = <T>(path: string, method: "POST" | "PUT" | "PATCH" | "DELETE", body?: object) =>
  api<T>(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
