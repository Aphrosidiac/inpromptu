import { Hono } from "hono";
import { getPrismaClient } from "../db/client";
import type { Env } from "../env";

const app = new Hono<{ Bindings: Env }>();

app.get("/:raceId/results", async (c) => {
  const prisma = getPrismaClient(c.env);
  const results = await prisma.raceResult.findMany({
    where: { raceId: c.req.param("raceId") },
    include: { participant: { include: { user: { select: { id: true, displayName: true } } } } },
    orderBy: [{ didNotFinish: "asc" }, { rank: "asc" }],
  });
  return c.json({ success: true, data: results });
});

export default app;
