import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { z } from "zod";
import { getPrismaClient } from "../db/client";
import { hashPassword, verifyPassword } from "../lib/passwords";
import { signAccessToken } from "../lib/jwt";
import { issueRefreshToken, rotateRefreshToken, revokeRefreshToken } from "../lib/refreshTokens";
import { setAuthCookies, clearAuthCookies, REFRESH_COOKIE } from "../lib/cookies";
import { requireAuth } from "../middleware/requireAuth";
import type { Env } from "../env";

const app = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

function serializeUser(user: { id: string; email: string; displayName: string; avatarUrl: string | null }) {
  return { id: user.id, email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl };
}

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(50),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

app.post("/signup", async (c) => {
  const parsed = SignupSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ success: false, message: "Invalid input" }, 400);
  const { email, password, displayName } = parsed.data;

  const prisma = getPrismaClient(c.env);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return c.json({ success: false, message: "Email already in use" }, 409);

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, passwordHash, displayName } });

  const accessToken = await signAccessToken(user.id, c.env.JWT_ACCESS_SECRET);
  const refreshToken = await issueRefreshToken(prisma, user.id);
  setAuthCookies(c, accessToken, refreshToken);

  return c.json({ success: true, data: serializeUser(user) }, 201);
});

app.post("/login", async (c) => {
  const parsed = LoginSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ success: false, message: "Invalid input" }, 400);
  const { email, password } = parsed.data;

  const prisma = getPrismaClient(c.env);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return c.json({ success: false, message: "Invalid email or password" }, 401);
  }

  const accessToken = await signAccessToken(user.id, c.env.JWT_ACCESS_SECRET);
  const refreshToken = await issueRefreshToken(prisma, user.id);
  setAuthCookies(c, accessToken, refreshToken);

  return c.json({ success: true, data: serializeUser(user) });
});

app.post("/refresh", async (c) => {
  const raw = getCookie(c, REFRESH_COOKIE);
  if (!raw) return c.json({ success: false, message: "No refresh token" }, 401);

  const prisma = getPrismaClient(c.env);
  const rotated = await rotateRefreshToken(prisma, raw);
  if (!rotated) {
    clearAuthCookies(c);
    return c.json({ success: false, message: "Invalid refresh token" }, 401);
  }

  const accessToken = await signAccessToken(rotated.userId, c.env.JWT_ACCESS_SECRET);
  setAuthCookies(c, accessToken, rotated.newRawToken);
  return c.json({ success: true });
});

app.post("/logout", async (c) => {
  const raw = getCookie(c, REFRESH_COOKIE);
  if (raw) await revokeRefreshToken(getPrismaClient(c.env), raw);
  clearAuthCookies(c);
  return c.json({ success: true });
});

app.get("/me", requireAuth, async (c) => {
  const prisma = getPrismaClient(c.env);
  const user = await prisma.user.findUnique({ where: { id: c.get("userId") } });
  if (!user) return c.json({ success: false, message: "User not found" }, 404);
  return c.json({ success: true, data: serializeUser(user) });
});

export default app;
