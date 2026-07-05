import { Hono } from "hono";
import { z } from "zod";
import { getPrismaClient } from "../db/client";
import { requireAuth } from "../middleware/requireAuth";
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

  const existingCount = await prisma.car.count({ where: { userId } });
  const car = await prisma.car.create({
    data: { ...parsed.data, userId, isActive: existingCount === 0 },
  });

  return c.json({ success: true, data: car }, 201);
});

app.patch("/:carId", requireAuth, async (c) => {
  const parsed = CarSchema.partial().safeParse(await c.req.json());
  if (!parsed.success) return c.json({ success: false, message: "Invalid input" }, 400);
  const prisma = getPrismaClient(c.env);

  const car = await prisma.car.findUnique({ where: { id: c.req.param("carId") } });
  if (!car || car.userId !== c.get("userId")) return c.json({ success: false, message: "Car not found" }, 404);

  const updated = await prisma.car.update({ where: { id: car.id }, data: parsed.data });
  return c.json({ success: true, data: updated });
});

app.delete("/:carId", requireAuth, async (c) => {
  const prisma = getPrismaClient(c.env);
  const car = await prisma.car.findUnique({ where: { id: c.req.param("carId") } });
  if (!car || car.userId !== c.get("userId")) return c.json({ success: false, message: "Car not found" }, 404);

  await prisma.car.delete({ where: { id: car.id } });
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
