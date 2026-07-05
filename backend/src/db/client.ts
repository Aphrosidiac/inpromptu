import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import type { Env } from "../env";

export function getPrismaClient(env: Env) {
  const adapter = new PrismaPg({ connectionString: env.HYPERDRIVE.connectionString });
  return new PrismaClient({ adapter });
}
