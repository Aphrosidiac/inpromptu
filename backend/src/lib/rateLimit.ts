import type { Context } from "hono";
import type { Env } from "../env";

// Cloudflare's native Workers Rate Limiting binding -- @cloudflare/workers-types doesn't
// ship a type for this yet, so it's declared locally to match the runtime API.
export interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export async function checkRateLimit<E extends { Bindings: Env }>(c: Context<E>, bucket: string): Promise<boolean> {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const { success } = await c.env.AUTH_RATE_LIMITER.limit({ key: `${bucket}:${ip}` });
  return success;
}
