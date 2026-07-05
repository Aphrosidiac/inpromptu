import { Hono } from "hono";
import { z } from "zod";
import { getPrismaClient } from "../db/client";
import { requireAuth } from "../middleware/requireAuth";
import { deleteR2Image } from "../lib/r2Images";
import { Prisma } from "../generated/prisma/client.js";
import type { Env } from "../env";

const app = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

const CarSchema = z.object({
  name: z.string().min(1).max(60),
  make: z.string().max(60).optional(),
  model: z.string().max(60).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  color: z.string().max(40).optional(),
  photoUrl: z.string().max(500).optional(),
  engineType: z.string().max(60).optional(),
  drivetrain: z.string().max(20).optional(),
  horsepowerHp: z.number().int().min(0).max(10000).optional(),
  torqueNm: z.number().int().min(0).max(10000).optional(),
  weightKg: z.number().int().min(0).max(10000).optional(),
  topSpeedKmh: z.number().int().min(0).max(1000).optional(),
  zeroToHundredSec: z.number().min(0).max(60).optional(),
});

app.get("/", requireAuth, async (c) => {
  const prisma = getPrismaClient(c.env);
  const cars = await prisma.car.findMany({
    where: { userId: c.get("userId") },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });
  return c.json({ success: true, data: cars });
});

app.post("/", requireAuth, async (c) => {
  const parsed = CarSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ success: false, message: "Invalid input" }, 400);
  const userId = c.get("userId");
  const prisma = getPrismaClient(c.env);

  // count() then create() isn't atomic under Read Committed -- two concurrent creates could
  // both read count=0 and both end up isActive:true, violating "exactly one active car per
  // user". Serializable isolation makes Postgres detect that read-write conflict and fail one
  // side with a retriable serialization error instead of silently allowing two active cars.
  try {
    const car = await prisma.$transaction(
      async (tx) => {
        const created = await tx.car.create({ data: { ...parsed.data, userId, isActive: false } });
        const activeCount = await tx.car.count({ where: { userId, isActive: true } });
        if (activeCount === 0) {
          return tx.car.update({ where: { id: created.id }, data: { isActive: true } });
        }
        return created;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
    return c.json({ success: true, data: car }, 201);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034") {
      return c.json({ success: false, message: "Please try again" }, 409);
    }
    throw err;
  }
});

app.patch("/:carId", requireAuth, async (c) => {
  const parsed = CarSchema.partial().safeParse(await c.req.json());
  if (!parsed.success) return c.json({ success: false, message: "Invalid input" }, 400);
  const prisma = getPrismaClient(c.env);

  const car = await prisma.car.findUnique({ where: { id: c.req.param("carId") } });
  if (!car || car.userId !== c.get("userId")) return c.json({ success: false, message: "Car not found" }, 404);

  const updated = await prisma.car.update({ where: { id: car.id }, data: parsed.data });

  // Replacing the cover photo previously left the old R2 object permanently orphaned.
  if (parsed.data.photoUrl !== undefined && car.photoUrl && car.photoUrl !== parsed.data.photoUrl) {
    await deleteR2Image(c.env.UPLOADS, car.photoUrl);
  }

  return c.json({ success: true, data: updated });
});

app.delete("/:carId", requireAuth, async (c) => {
  const prisma = getPrismaClient(c.env);
  const car = await prisma.car.findUnique({ where: { id: c.req.param("carId") } });
  if (!car || car.userId !== c.get("userId")) return c.json({ success: false, message: "Car not found" }, 404);

  await prisma.car.delete({ where: { id: car.id } });
  await deleteR2Image(c.env.UPLOADS, car.photoUrl);
  return c.json({ success: true });
});

app.post("/:carId/activate", requireAuth, async (c) => {
  const userId = c.get("userId");
  const prisma = getPrismaClient(c.env);
  const car = await prisma.car.findUnique({ where: { id: c.req.param("carId") } });
  if (!car || car.userId !== userId) return c.json({ success: false, message: "Car not found" }, 404);

  await prisma.$transaction([
    prisma.car.updateMany({ where: { userId }, data: { isActive: false } }),
    prisma.car.update({ where: { id: car.id }, data: { isActive: true } }),
  ]);

  return c.json({ success: true });
});

export default app;
