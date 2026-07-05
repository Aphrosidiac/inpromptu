import { setCookie, deleteCookie } from "hono/cookie";
import type { Context } from "hono";
import type { Env } from "../env";

const ACCESS_COOKIE = "inpromptu_access";
const REFRESH_COOKIE = "inpromptu_refresh";
const ACCESS_MAX_AGE = 60 * 20; // 20 minutes
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function isProd<E extends { Bindings: Env }>(c: Context<E>) {
  return c.env.ENVIRONMENT === "production";
}

export function setAuthCookies<E extends { Bindings: Env }>(
  c: Context<E>,
  accessToken: string,
  refreshToken: string
) {
  setCookie(c, ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: isProd(c) ? "Lax" : "None",
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  });
  setCookie(c, REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: isProd(c) ? "Lax" : "None",
    path: "/api/auth",
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearAuthCookies<E extends { Bindings: Env }>(c: Context<E>) {
  deleteCookie(c, ACCESS_COOKIE, { path: "/" });
  deleteCookie(c, REFRESH_COOKIE, { path: "/api/auth" });
}

export { ACCESS_COOKIE, REFRESH_COOKIE };
