import type { AgentNamespace } from "agents";
import type { RaceRoomAgent } from "./agents/RaceRoomAgent";

export interface Env {
  RACE_ROOM: AgentNamespace<RaceRoomAgent>;
  HYPERDRIVE: Hyperdrive;
  UPLOADS: R2Bucket;
  ENVIRONMENT: "development" | "production";
  FRONTEND_ORIGIN: string;
  JWT_ACCESS_SECRET: string;
  REFRESH_TOKEN_HASH_SECRET: string;
  ORS_API_KEY: string;
}
