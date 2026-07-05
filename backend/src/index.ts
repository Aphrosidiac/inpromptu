import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie } from "hono/cookie";
import { getAgentByName } from "agents";
import authRoutes from "./routes/auth";
import raceRoutes from "./routes/races";
import resultsRoutes from "./routes/results";
import userRoutes from "./routes/users";
import uploadRoutes from "./routes/uploads";
import carRoutes from "./routes/cars";
import { verifyAccessToken } from "./lib/jwt";
import type { Env } from "./env";

export { RaceRoomAgent } from "./agents/RaceRoomAgent";

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: (_origin, c) => c.env.FRONTEND_ORIGIN,
    credentials: true,
  })
);

// CORS alone only stops browser JS from *reading* a cross-site response -- it does not stop
// the browser from *sending* a cross-site request in the first place (e.g. a hidden auto-submit
// form using a "simple request" content-type, which skips preflight entirely). Since sessions
// are cookie-based with SameSite=None (required for the pages.dev/workers.dev split), that gap
// is a real CSRF vector. Origin is a forbidden header browsers set truthfully and cannot be
// scripted around, so checking it here on every state-changing request closes the gap.
app.use("*", async (c, next) => {
  const method = c.req.method;
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    if (c.req.header("Origin") !== c.env.FRONTEND_ORIGIN) {
      return c.json({ success: false, message: "Forbidden" }, 403);
    }
  }
  await next();
});

app.get("/api/health", (c) => c.json({ success: true, data: { status: "ok" } }));

app.route("/api/auth", authRoutes);
app.route("/api/races", raceRoutes);
app.route("/api/races", resultsRoutes);
app.route("/api/users", userRoutes);
app.route("/api/uploads", uploadRoutes);
app.route("/api/cars", carRoutes);

// The WebSocket upgrade can't go through requireAuth (it's not a normal REST call), but it
// still needs real authentication -- otherwise any client can pass ?userId=<victim> and inject
// fake position/finish data on someone else's behalf. Verify the access-token cookie here and
// overwrite the userId query param with the verified identity before forwarding to the DO, so
// RaceRoomAgent's onConnect never has to trust a client-supplied value.
app.get("/api/races/:raceId/live", async (c) => {
  const token = getCookie(c, "inpromptu_access");
  if (!token) return c.json({ success: false, message: "Unauthorized" }, 401);
  let userId: string;
  try {
    userId = await verifyAccessToken(token, c.env.JWT_ACCESS_SECRET);
  } catch {
    return c.json({ success: false, message: "Unauthorized" }, 401);
  }

  const url = new URL(c.req.raw.url);
  url.searchParams.set("userId", userId);
  const authedRequest = new Request(url.toString(), {
    method: c.req.raw.method,
    headers: c.req.raw.headers,
  });

  const agent = await getAgentByName(c.env.RACE_ROOM, c.req.param("raceId"));
  return agent.fetch(authedRequest);
});

// Public, unauthenticated -- serves uploaded avatar/car photos straight from R2.
app.get("/api/images/*", async (c) => {
  const key = c.req.path.replace(/^\/api\/images\//, "");
  const object = await c.env.UPLOADS.get(key);
  if (!object) return c.notFound();

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: object.httpEtag,
    },
  });
});

export default app;
