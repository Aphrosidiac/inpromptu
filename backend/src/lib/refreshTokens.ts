import type { PrismaClient } from "../generated/prisma/client.js";
import { generateOpaqueToken, sha256Hex } from "./jwt";

const REFRESH_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export async function issueRefreshToken(prisma: PrismaClient, userId: string) {
  const raw = generateOpaqueToken();
  const tokenHash = await sha256Hex(raw);
  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt: new Date(Date.now() + REFRESH_TTL_MS) },
  });
  return raw;
}

// Validates the presented refresh token, rotates it (marks old as revoked/replaced, issues a
// new one), and returns the new raw token + owning userId. Returns null if invalid/expired.
// If the presented token was already revoked (reuse of a rotated-out token), treats it as a
// compromise signal and revokes the user's entire active refresh-token set.
export async function rotateRefreshToken(prisma: PrismaClient, rawToken: string) {
  const tokenHash = await sha256Hex(rawToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!existing) return null;

  if (existing.revokedAt || existing.expiresAt < new Date()) {
    if (existing.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { userId: existing.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return null;
  }

  const newRaw = generateOpaqueToken();
  const newHash = await sha256Hex(newRaw);

  await prisma.$transaction([
    prisma.refreshToken.create({
      data: { userId: existing.userId, tokenHash: newHash, expiresAt: new Date(Date.now() + REFRESH_TTL_MS) },
    }),
    prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date(), replacedBy: newHash },
    }),
  ]);

  return { userId: existing.userId, newRawToken: newRaw };
}

export async function revokeRefreshToken(prisma: PrismaClient, rawToken: string) {
  const tokenHash = await sha256Hex(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
