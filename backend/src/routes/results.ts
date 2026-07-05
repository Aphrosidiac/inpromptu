import { Hono } from "hono";
import { getPrismaClient } from "../db/client";
import { requireAuth } from "../middleware/requireAuth";
import type { Env } from "../env";

const app = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

app.get("/:raceId/results", requireAuth, async (c) => {
  const userId = c.get("userId");
  const raceId = c.req.param("raceId");
  const prisma = getPrismaClient(c.env);

  // Results (finish times, ranks, DNF status) were previously unauthenticated and unscoped --
  // anyone who knew a raceId could read every participant's results for any race.
  const participant = await prisma.raceParticipant.findUnique({
    where: { raceId_userId: { raceId, userId } },
  });
  if (!participant) return c.json({ success: false, message: "Race not found" }, 404);

  const results = await prisma.raceResult.findMany({
    where: { raceId },
    include: { participant: { include: { user: { select: { id: true, displayName: true } } } } },
    orderBy: [{ didNotFinish: "asc" }, { rank: "asc" }],
  });
  return c.json({ success: true, data: results });
});

export default app;
