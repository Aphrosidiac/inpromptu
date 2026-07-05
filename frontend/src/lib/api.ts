const API_URL = import.meta.env.VITE_API_URL;

// Host (no protocol/path) for the Agents SDK WebSocket connection, derived from the same
// API URL — Inpromptu deliberately has one backend origin for both REST and realtime.
export const SOCKET_HOST = new URL(API_URL).host;

// Backend origin (no /api suffix) — used to resolve the relative /api/images/... paths
// returned by the upload endpoint into real <img src> URLs, since the frontend and backend
// run on different origins in dev.
const API_ORIGIN = new URL(API_URL).origin;
export function resolveImageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  return path.startsWith("http") ? path : `${API_ORIGIN}${path}`;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Concurrent 401s must share one refresh attempt -- the refresh token rotates on use, so
// firing it multiple times in parallel would trip reuse detection and log the user out.
let refreshPromise: Promise<boolean> | null = null;

function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  // The access token is short-lived (20min) -- a 401 here usually just means it expired
  // mid-session, not that the user is actually logged out. Silently refresh and retry once
  // before giving up, so callers don't need to handle this themselves.
  if (res.status === 401 && !isRetry && path !== "/auth/refresh" && path !== "/auth/login") {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request<T>(path, options, true);
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, body?.message ?? "Request failed");
  }
  return body?.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export async function uploadImage(file: File, isRetry = false): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/uploads`, { method: "POST", credentials: "include", body: formData });

  if (res.status === 401 && !isRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return uploadImage(file, true);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body?.message ?? "Upload failed");
  return body.data;
}
