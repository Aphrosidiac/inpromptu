import { Hono } from "hono";
import { z } from "zod";
import { getPrismaClient } from "../db/client";
import { requireAuth } from "../middleware/requireAuth";
import { pickRandomDestination } from "../lib/randomRoute";
import { getDrivingRoute, RoutingError } from "../lib/routing";
import { getAgentByName } from "agents";
import type { Prisma } from "../generated/prisma/client.js";
import type { Env } from "../env";

const app = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

const RandomRouteSchema = z.object({
  mode: z.literal("RANDOM_ROUTE"),
  name: z.string().min(1).max(80),
  distanceMeters: z.number().int().min(1000).max(10000),
  originLat: z.number(),
  originLng: z.number(),
  finishRadiusMeters: z.number().int().min(10).max(100).default(25),
  timeoutSeconds: z.number().int().positive().optional(),
});

const PinDropSchema = z.object({
  mode: z.literal("PIN_DROP"),
  name: z.string().min(1).max(80),
  startLat: z.number(),
  startLng: z.number(),
  endLat: z.number(),
  endLng: z.number(),
  finishRadiusMeters: z.number().int().min(10).max(100).default(25),
  timeoutSeconds: z.number().int().positive().optional(),
});

const CreateRaceSchema = z.discriminatedUnion("mode", [RandomRouteSchema, PinDropSchema]);

app.post("/", requireAuth, async (c) => {
  const parsed = CreateRaceSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ success: false, message: "Invalid input" }, 400);
  const body = parsed.data;
  const hostId = c.get("userId");
  const prisma = getPrismaClient(c.env);

  let startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
    waypoints: Prisma.InputJsonValue,
    distanceMeters: number;

  try {
    if (body.mode === "RANDOM_ROUTE") {
      const destination = pickRandomDestination(body.originLat, body.originLng, body.distanceMeters);
      const route = await getDrivingRoute(c.env.ORS_API_KEY, [
        { lat: body.originLat, lng: body.originLng },
        destination,
      ]);
      startLat = body.originLat;
      startLng = body.originLng;
      endLat = destination.lat;
      endLng = destination.lng;
      waypoints = route.waypoints;
      distanceMeters = route.distanceMeters;
    } else {
      const route = await getDrivingRoute(c.env.ORS_API_KEY, [
        { lat: body.startLat, lng: body.startLng },
        { lat: body.endLat, lng: body.endLng },
      ]);
      startLat = body.startLat;
      startLng = body.startLng;
      endLat = body.endLat;
      endLng = body.endLng;
      waypoints = route.waypoints;
      distanceMeters = route.distanceMeters;
    }
  } catch (err) {
    if (err instanceof RoutingError) {
      return c.json({ success: false, message: "Could not calculate a route between those points" }, 502);
    }
    throw err;
  }

  const race = await prisma.race.create({
    data: {
      hostId,
      mode: body.mode,
      status: "LOBBY",
      name: body.name,
      distanceMeters,
      startLat,
      startLng,
      endLat,
      endLng,
      waypoints,
      finishRadiusMeters: body.finishRadiusMeters,
      timeoutSeconds: body.timeoutSeconds,
      participants: { create: { userId: hostId, status: "JOINED" } },
    },
    include: { participants: true },
  });

  const agent = await getAgentByName(c.env.RACE_ROOM, race.id);
  await agent.initFromRace(race.id);

  return c.json({ success: true, data: race }, 201);
});

app.get("/history", requireAuth, async (c) => {
  const userId = c.get("userId");
  const prisma = getPrismaClient(c.env);
  const participations = await prisma.raceParticipant.findMany({
    where: { userId, race: { status: "FINISHED" } },
    include: { race: true, result: true },
    orderBy: { race: { raceEndedAt: "desc" } },
    take: 50,
  });
  return c.json({ success: true, data: participations });
});

app.get("/", requireAuth, async (c) => {
  const userId = c.get("userId");
  const statusFilter = c.req.query("status");
  const prisma = getPrismaClient(c.env);

  const races = await prisma.race.findMany({
    where: {
      participants: { some: { userId } },
      ...(statusFilter ? { status: statusFilter as never } : {}),
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, displayName: true, cars: { where: { isActive: true }, take: 1 } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return c.json({ success: true, data: races });
});

// Public preview for shareable invite links -- intentionally unauthenticated so a link can be
// opened before signup/login, but returns only non-sensitive summary fields.
app.get("/:raceId/preview", async (c) => {
  const prisma = getPrismaClient(c.env);
  const race = await prisma.race.findUnique({
    where: { id: c.req.param("raceId") },
    include: { host: { select: { displayName: true } }, participants: true },
  });
  if (!race) return c.json({ success: false, message: "Race not found" }, 404);
  return c.json({
    success: true,
    data: {
      id: race.id,
      name: race.name,
      mode: race.mode,
      status: race.status,
      distanceMeters: race.distanceMeters,
      hostName: race.host.displayName,
      participantCount: race.participants.length,
    },
  });
});

app.get("/:raceId", requireAuth, async (c) => {
  const prisma = getPrismaClient(c.env);
  const race = await prisma.race.findUnique({
    where: { id: c.req.param("raceId") },
    include: {
      participants: {
        include: {
          user: { select: { id: true, displayName: true, cars: { where: { isActive: true }, take: 1 } } },
        },
      },
    },
  });
  if (!race) return c.json({ success: false, message: "Race not found" }, 404);
  return c.json({ success: true, data: race });
});

app.post("/:raceId/join", requireAuth, async (c) => {
  const raceId = c.req.param("raceId");
  const userId = c.get("userId");
  const prisma = getPrismaClient(c.env);

  const race = await prisma.race.findUnique({ where: { id: raceId } });
  if (!race) return c.json({ success: false, message: "Race not found" }, 404);
  if (race.status !== "LOBBY" && race.status !== "DRAFT") {
    return c.json({ success: false, message: "Race is no longer joinable" }, 409);
  }

  const participant = await prisma.raceParticipant.upsert({
    where: { raceId_userId: { raceId, userId } },
    update: {},
    create: { raceId, userId, status: "JOINED" },
  });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { cars: { where: { isActive: true }, take: 1 } },
  });
  const activeCar = user.cars[0];
  const agent = await getAgentByName(c.env.RACE_ROOM, raceId);
  await agent.initFromRace(raceId);
  await agent.addRacer(userId, user.displayName, activeCar?.name, activeCar?.photoUrl ?? undefined);

  return c.json({ success: true, data: participant });
});

app.post("/:raceId/start", requireAuth, async (c) => {
  const raceId = c.req.param("raceId");
  const userId = c.get("userId");
  const prisma = getPrismaClient(c.env);

  const race = await prisma.race.findUnique({ where: { id: raceId } });
  if (!race) return c.json({ success: false, message: "Race not found" }, 404);
  if (race.hostId !== userId) return c.json({ success: false, message: "Only the host can start the race" }, 403);
  if (race.status !== "LOBBY") return c.json({ success: false, message: "Race is not in lobby" }, 409);

  const agent = await getAgentByName(c.env.RACE_ROOM, raceId);
  await agent.initFromRace(raceId);
  await agent.startCountdown();

  return c.json({ success: true });
});

export default app;
