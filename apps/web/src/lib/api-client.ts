import type { ApiErrorBody } from "@/lib/api-schemas";

/** Error thrown by apiFetch for non-2xx responses; `message` is user-facing Turkish. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** fetch() wrapper for our own JSON API routes. */
export async function apiFetch<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, headers, ...rest } = init ?? {};
  let res: Response;
  try {
    res = await fetch(path, {
      ...rest,
      headers: json === undefined ? headers : { "Content-Type": "application/json", ...headers },
      body: json === undefined ? rest.body : JSON.stringify(json),
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Sunucuya ulaşılamadı.");
  }
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const error = (body as Partial<ApiErrorBody> | null)?.error;
    throw new ApiError(res.status, error?.code ?? "HTTP_ERROR", error?.message ?? `HTTP ${res.status}`);
  }
  return body as T;
}
