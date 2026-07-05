import { Hono } from "hono";
import { cors } from "hono/cors";
import { getAgentByName } from "agents";
import authRoutes from "./routes/auth";
import raceRoutes from "./routes/races";
import resultsRoutes from "./routes/results";
import userRoutes from "./routes/users";
import uploadRoutes from "./routes/uploads";
import carRoutes from "./routes/cars";
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

app.get("/api/health", (c) => c.json({ success: true, data: { status: "ok" } }));

app.route("/api/auth", authRoutes);
app.route("/api/races", raceRoutes);
app.route("/api/races", resultsRoutes);
app.route("/api/users", userRoutes);
app.route("/api/uploads", uploadRoutes);
app.route("/api/cars", carRoutes);

app.get("/api/races/:raceId/live", async (c) => {
  const agent = await getAgentByName(c.env.RACE_ROOM, c.req.param("raceId"));
  return agent.fetch(c.req.raw);
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
