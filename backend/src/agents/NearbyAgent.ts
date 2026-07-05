import { Agent, type Connection, type ConnectionContext, type WSMessage } from "agents";
import type { Env } from "../env";

export type NearbyUserState = {
  userId: string;
  displayName: string;
  carPhotoUrl?: string;
  lat: number;
  lng: number;
  speedKmh: number;
  lastUpdateAt: number;
};

export type NearbyRoomState = {
  users: Record<string, NearbyUserState>;
};

type ConnAttachment = { userId: string; displayName: string; carPhotoUrl?: string };

// A single global instance (addressed by a fixed name, not per-race) -- every opted-in user
// connects here and broadcasts their live position to every other connected user, who filter
// to "nearby" client-side. Identity (userId/displayName/carPhotoUrl) and the shareLocation
// opt-in check both happen in index.ts before the request ever reaches this DO, the same way
// RaceRoomAgent's WebSocket route never trusts a client-supplied userId.
export class NearbyAgent extends Agent<Env, NearbyRoomState> {
  initialState: NearbyRoomState = { users: {} };

  onConnect(conn: Connection, ctx: ConnectionContext) {
    const url = new URL(ctx.request.url);
    const userId = url.searchParams.get("userId");
    const displayName = url.searchParams.get("displayName");
    if (!userId || !displayName) {
      conn.close(4001, "Missing identity");
      return;
    }
    const carPhotoUrl = url.searchParams.get("carPhotoUrl") ?? undefined;
    conn.serializeAttachment({ userId, displayName, carPhotoUrl } satisfies ConnAttachment);
  }

  onClose(conn: Connection) {
    const attachment = conn.deserializeAttachment() as ConnAttachment | null;
    if (!attachment?.userId) return;
    const { [attachment.userId]: _removed, ...rest } = this.state.users;
    this.setState({ users: rest });
  }

  onMessage(conn: Connection, message: WSMessage) {
    if (typeof message !== "string") return;
    let msg: { type: string; lat?: number; lng?: number; speedKmh?: number };
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }
    if (msg.type !== "POSITION_UPDATE") return;
    // Same NaN/bounds guard as RaceRoomAgent -- typeof NaN === "number", so a bare typeof
    // check would let a bad sample through and broadcast garbage coordinates to everyone.
    if (
      typeof msg.lat !== "number" ||
      typeof msg.lng !== "number" ||
      !Number.isFinite(msg.lat) ||
      !Number.isFinite(msg.lng) ||
      msg.lat < -90 ||
      msg.lat > 90 ||
      msg.lng < -180 ||
      msg.lng > 180
    ) {
      return;
    }

    const attachment = conn.deserializeAttachment() as ConnAttachment | null;
    if (!attachment?.userId) return;
    const speedKmh = typeof msg.speedKmh === "number" && Number.isFinite(msg.speedKmh) && msg.speedKmh >= 0 ? msg.speedKmh : 0;

    this.setState({
      users: {
        ...this.state.users,
        [attachment.userId]: {
          userId: attachment.userId,
          displayName: attachment.displayName,
          carPhotoUrl: attachment.carPhotoUrl,
          lat: msg.lat,
          lng: msg.lng,
          speedKmh,
          lastUpdateAt: Date.now(),
        },
      },
    });
  }
}
