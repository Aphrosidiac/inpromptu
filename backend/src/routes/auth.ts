import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { z } from "zod";
import { getPrismaClient } from "../db/client";
import { hashPassword, verifyPassword } from "../lib/passwords";
import { signAccessToken } from "../lib/jwt";
import { issueRefreshToken, rotateRefreshToken, revokeRefreshToken } from "../lib/refreshTokens";
import { setAuthCookies, clearAuthCookies, REFRESH_COOKIE } from "../lib/cookies";
import { requireAuth } from "../middleware/requireAuth";
import { checkRateLimit } from "../lib/rateLimit";
import { Prisma } from "../generated/prisma/client.js";
import type { Env } from "../env";

const app = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

function serializeUser(user: { id: string; email: string; displayName: string; avatarUrl: string | null }) {
  return { id: user.id, email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

// bcrypt silently truncates input beyond 72 bytes -- without this cap, two different
// passwords sharing the first 72 bytes would hash identically and both would authenticate.
const MAX_PASSWORD_BYTES = 72;

const SignupSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .refine((pw) => new TextEncoder().encode(pw).length <= MAX_PASSWORD_BYTES, {
      message: "Password is too long",
    }),
  displayName: z.string().min(1).max(50),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

app.post("/signup", async (c) => {
  if (!(await checkRateLimit(c, "signup"))) {
    return c.json({ success: false, message: "Too many attempts, try again shortly" }, 429);
  }
  const parsed = SignupSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ success: false, message: "Invalid input" }, 400);
  const email = normalizeEmail(parsed.data.email);
  const { password, displayName } = parsed.data;

  const prisma = getPrismaClient(c.env);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return c.json({ success: false, message: "Email already in use" }, 409);

  const passwordHash = await hashPassword(password);
  let user;
  try {
    user = await prisma.user.create({ data: { email, passwordHash, displayName } });
  } catch (err) {
    // Two concurrent signups with the same email both pass the findUnique check above --
    // the DB's unique constraint is the real guard, so a race here surfaces as P2002.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return c.json({ success: false, message: "Email already in use" }, 409);
    }
    throw err;
  }

  const accessToken = await signAccessToken(user.id, c.env.JWT_ACCESS_SECRET);
  const refreshToken = await issueRefreshToken(prisma, user.id);
  setAuthCookies(c, accessToken, refreshToken);

  return c.json({ success: true, data: serializeUser(user) }, 201);
});

app.post("/login", async (c) => {
  if (!(await checkRateLimit(c, "login"))) {
    return c.json({ success: false, message: "Too many attempts, try again shortly" }, 429);
  }
  const parsed = LoginSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ success: false, message: "Invalid input" }, 400);
  const email = normalizeEmail(parsed.data.email);
  const { password } = parsed.data;

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
  // Deliberately not rate-limited: this endpoint fires automatically and invisibly on the
  // client whenever any request hits an expired access token, so normal use (multiple tabs,
  // quick navigation) can burn through a request budget fast -- and a 429 here gets treated
  // as "logged out" client-side, which would silently kick out an otherwise-valid session.
  // Rate limiting also buys nothing security-wise here: replaying a stolen refresh token is
  // already caught by rotation + reuse-detection regardless of how fast it's attempted.
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
