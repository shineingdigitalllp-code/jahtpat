export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const headers = new Headers(options?.headers);
  if (!headers.has('Content-Type') && !(options?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 204) {
    return {} as T;
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const error = json?.error;
    const err = new ApiError(
      response.status,
      error?.code || 'UNKNOWN_ERROR',
      error?.message || response.statusText || 'Request failed',
      error?.details,
    );

    if (response.status === 401 && typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
        window.location.href = `/login?next=${encodeURIComponent(pathname + window.location.search)}`;
      }
    }

    throw err;
  }

  return (json?.data !== undefined ? json.data : json) as T;
}

