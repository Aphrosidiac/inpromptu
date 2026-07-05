import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { verifyAccessToken } from "../lib/jwt";
import type { Env } from "../env";

export const requireAuth = createMiddleware<{ Bindings: Env; Variables: { userId: string } }>(
  async (c, next) => {
    const token = getCookie(c, "inpromptu_access");
    if (!token) return c.json({ success: false, message: "Unauthorized" }, 401);
    try {
      const userId = await verifyAccessToken(token, c.env.JWT_ACCESS_SECRET);
      c.set("userId", userId);
      await next();
    } catch {
      return c.json({ success: false, message: "Unauthorized" }, 401);
    }
  }
);
