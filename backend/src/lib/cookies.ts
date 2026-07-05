import { setCookie, deleteCookie } from "hono/cookie";
import type { Context } from "hono";
import type { Env } from "../env";

const ACCESS_COOKIE = "inpromptu_access";
const REFRESH_COOKIE = "inpromptu_refresh";
const ACCESS_MAX_AGE = 60 * 20; // 20 minutes
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function setAuthCookies<E extends { Bindings: Env }>(
  c: Context<E>,
  accessToken: string,
  refreshToken: string
) {
  // Frontend (*.pages.dev) and backend (*.workers.dev) are different eTLD+1 domains,
  // so these cookies are cross-site in every environment -- SameSite=None is required
  // (Lax cookies are dropped on cross-site fetch/XHR, which would silently break login).
  setCookie(c, ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  });
  setCookie(c, REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/api/auth",
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearAuthCookies<E extends { Bindings: Env }>(c: Context<E>) {
  deleteCookie(c, ACCESS_COOKIE, { path: "/" });
  deleteCookie(c, REFRESH_COOKIE, { path: "/api/auth" });
}

export { ACCESS_COOKIE, REFRESH_COOKIE };
