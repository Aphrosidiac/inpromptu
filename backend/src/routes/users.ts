import { Hono } from "hono";
import { z } from "zod";
import { getPrismaClient } from "../db/client";
import { requireAuth } from "../middleware/requireAuth";
import { deleteR2Image } from "../lib/r2Images";
import type { Env } from "../env";

const app = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

function serializeUser(user: { id: string; email: string; displayName: string; avatarUrl: string | null; shareLocation: boolean }) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    shareLocation: user.shareLocation,
  };
}

app.patch("/me", requireAuth, async (c) => {
  const parsed = z
    .object({ avatarUrl: z.string().max(500).optional(), shareLocation: z.boolean().optional() })
    .safeParse(await c.req.json());
  if (!parsed.success) return c.json({ success: false, message: "Invalid input" }, 400);

  const prisma = getPrismaClient(c.env);
  const previous = await prisma.user.findUnique({ where: { id: c.get("userId") } });
  const user = await prisma.user.update({
    where: { id: c.get("userId") },
    data: parsed.data,
  });

  // Replacing the avatar previously left the old R2 object permanently orphaned.
  if (
    parsed.data.avatarUrl !== undefined &&
    previous?.avatarUrl &&
    previous.avatarUrl !== parsed.data.avatarUrl
  ) {
    await deleteR2Image(c.env.UPLOADS, previous.avatarUrl);
  }

  return c.json({ success: true, data: serializeUser(user) });
});

async function computeStats(prisma: ReturnType<typeof getPrismaClient>, userId: string) {
  const [racesJoined, results] = await Promise.all([
    prisma.raceParticipant.count({ where: { userId } }),
    prisma.raceResult.findMany({ where: { userId } }),
  ]);

  const finished = results.filter((r) => !r.didNotFinish);
  const wins = finished.filter((r) => r.rank === 1).length;
  const bestElapsedMs = finished.length ? Math.min(...finished.map((r) => r.elapsedMs ?? Infinity)) : null;
  const bestSpeedKmh = finished.length ? Math.max(...finished.map((r) => r.averageSpeedKmh ?? 0)) : null;
  const totalDistanceKm = results.reduce((sum, r) => sum + r.finalDistanceMeters, 0) / 1000;

  return {
    racesJoined,
    racesFinished: finished.length,
    wins,
    bestElapsedMs: bestElapsedMs === Infinity ? null : bestElapsedMs,
    bestSpeedKmh,
    totalDistanceKm,
  };
}

app.get("/me/stats", requireAuth, async (c) => {
  const prisma = getPrismaClient(c.env);
  const stats = await computeStats(prisma, c.get("userId"));
  return c.json({ success: true, data: stats });
});

// Public-ish profile card for another user -- shown when tapping their marker on the live map
// or a racer in a shared race. Anyone who's already visible to other users via the nearby map
// or a race lobby is fine surfacing this (display name, avatar, race stats, garage); it's the
// same category of info already shown elsewhere, just gathered into one view. Never includes
// email or anything else account-sensitive.
app.get("/:userId/profile", requireAuth, async (c) => {
  const userId = c.req.param("userId");
  const prisma = getPrismaClient(c.env);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return c.json({ success: false, message: "User not found" }, 404);

  const [stats, cars] = await Promise.all([
    computeStats(prisma, userId),
    prisma.car.findMany({ where: { userId }, orderBy: [{ isActive: "desc" }, { createdAt: "desc" }] }),
  ]);

  return c.json({
    success: true,
    data: {
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      stats,
      cars,
    },
  });
});

export default app;
