import type { AgentNamespace } from "agents";
import type { RaceRoomAgent } from "./agents/RaceRoomAgent";
import type { NearbyAgent } from "./agents/NearbyAgent";
import type { RateLimiter } from "./lib/rateLimit";

export interface Env {
  RACE_ROOM: AgentNamespace<RaceRoomAgent>;
  NEARBY: AgentNamespace<NearbyAgent>;
  HYPERDRIVE: Hyperdrive;
  UPLOADS: R2Bucket;
  AUTH_RATE_LIMITER: RateLimiter;
  ENVIRONMENT: "development" | "production";
  FRONTEND_ORIGIN: string;
  JWT_ACCESS_SECRET: string;
  REFRESH_TOKEN_HASH_SECRET: string;
  ORS_API_KEY: string;
}
