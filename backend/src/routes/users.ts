import { Hono } from "hono";
import { z } from "zod";
import { getPrismaClient } from "../db/client";
import { requireAuth } from "../middleware/requireAuth";
import type { Env } from "../env";

const app = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

app.patch("/me", requireAuth, async (c) => {
  const parsed = z.object({ avatarUrl: z.string().max(500) }).safeParse(await c.req.json());
  if (!parsed.success) return c.json({ success: false, message: "Invalid input" }, 400);

  const prisma = getPrismaClient(c.env);
  const user = await prisma.user.update({
    where: { id: c.get("userId") },
    data: { avatarUrl: parsed.data.avatarUrl },
  });
  return c.json({ success: true, data: { id: user.id, email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl } });
});

app.get("/me/stats", requireAuth, async (c) => {
  const userId = c.get("userId");
  const prisma = getPrismaClient(c.env);

  const [racesJoined, results] = await Promise.all([
    prisma.raceParticipant.count({ where: { userId } }),
    prisma.raceResult.findMany({ where: { userId } }),
  ]);

  const finished = results.filter((r) => !r.didNotFinish);
  const wins = finished.filter((r) => r.rank === 1).length;
  const bestElapsedMs = finished.length ? Math.min(...finished.map((r) => r.elapsedMs ?? Infinity)) : null;
  const bestSpeedKmh = finished.length
    ? Math.max(...finished.map((r) => r.averageSpeedKmh ?? 0))
    : null;
  const totalDistanceKm = results.reduce((sum, r) => sum + r.finalDistanceMeters, 0) / 1000;

  return c.json({
    success: true,
    data: {
      racesJoined,
      racesFinished: finished.length,
      wins,
      bestElapsedMs: bestElapsedMs === Infinity ? null : bestElapsedMs,
      bestSpeedKmh,
      totalDistanceKm,
    },
  });
});

export default app;
