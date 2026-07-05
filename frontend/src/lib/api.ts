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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });

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

export async function uploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/uploads`, { method: "POST", credentials: "include", body: formData });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body?.message ?? "Upload failed");
  return body.data;
}
