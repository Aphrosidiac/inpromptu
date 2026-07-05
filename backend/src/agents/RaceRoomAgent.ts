import { Agent, type Connection, type ConnectionContext, type WSMessage } from "agents";
import { getPrismaClient } from "../db/client";
import { haversineMeters } from "../lib/haversine";
import type { Env } from "../env";

export type RacerLiveState = {
  userId: string;
  displayName: string;
  carName?: string;
  carPhotoUrl?: string;
  lat: number;
  lng: number;
  speedKmh: number;
  lastUpdateAt: number;
  distanceTraveled: number;
  status: "LOBBY" | "READY" | "RACING" | "FINISHED" | "DISCONNECTED";
  finishedAt?: number;
  elapsedMs?: number;
  rank?: number;
};

export type RaceRoomState = {
  raceId: string;
  hostId: string;
  status: "LOBBY" | "COUNTDOWN" | "ACTIVE" | "FINISHED";
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  waypoints: { lat: number; lng: number }[];
  finishRadiusMeters: number;
  timeoutSeconds: number | null;
  countdownStartsAt: number | null;
  raceStartAt: number | null;
  raceDeadlineAt: number | null;
  racers: Record<string, RacerLiveState>;
};

const COUNTDOWN_MS = 3000;
const START_BUFFER_MS = 500;

export class RaceRoomAgent extends Agent<Env, RaceRoomState> {
  initialState: RaceRoomState = {
    raceId: "",
    hostId: "",
    status: "LOBBY",
    startLat: 0,
    startLng: 0,
    endLat: 0,
    endLng: 0,
    waypoints: [],
    finishRadiusMeters: 25,
    timeoutSeconds: null,
    countdownStartsAt: null,
    raceStartAt: null,
    raceDeadlineAt: null,
    racers: {},
  };

  async initFromRace(raceId: string) {
    if (this.state.raceId) return;
    const prisma = getPrismaClient(this.env);
    const race = await prisma.race.findUniqueOrThrow({
      where: { id: raceId },
      include: {
        participants: { include: { user: { include: { cars: { where: { isActive: true }, take: 1 } } } } },
      },
    });

    const racers: Record<string, RacerLiveState> = {};
    for (const p of race.participants) {
      const activeCar = p.user.cars[0];
      racers[p.userId] = {
        userId: p.userId,
        displayName: p.user.displayName,
        carName: activeCar?.name,
        carPhotoUrl: activeCar?.photoUrl ?? undefined,
        lat: race.startLat,
        lng: race.startLng,
        speedKmh: 0,
        lastUpdateAt: Date.now(),
        distanceTraveled: 0,
        status: "LOBBY",
      };
    }

    this.setState({
      ...this.state,
      raceId: race.id,
      hostId: race.hostId,
      startLat: race.startLat,
      startLng: race.startLng,
      endLat: race.endLat,
      endLng: race.endLng,
      waypoints: race.waypoints as { lat: number; lng: number }[],
      finishRadiusMeters: race.finishRadiusMeters,
      timeoutSeconds: race.timeoutSeconds,
      racers,
    });
  }

  // Adds a racer who joined after the room was already initialized (initFromRace only loads
  // participants that existed at that moment — later joiners need to be added explicitly).
  async addRacer(userId: string, displayName: string, carName?: string, carPhotoUrl?: string) {
    if (!this.state.raceId || this.state.racers[userId]) return;
    this.setState({
      ...this.state,
      racers: {
        ...this.state.racers,
        [userId]: {
          userId,
          displayName,
          carName,
          carPhotoUrl,
          lat: this.state.startLat,
          lng: this.state.startLng,
          speedKmh: 0,
          lastUpdateAt: Date.now(),
          distanceTraveled: 0,
          status: "LOBBY",
        },
      },
    });
  }

  async startCountdown() {
    if (this.state.status !== "LOBBY") throw new Error("Race not in lobby");

    const countdownStartsAt = Date.now() + START_BUFFER_MS;
    const raceStartAt = countdownStartsAt + COUNTDOWN_MS;
    const raceDeadlineAt = this.state.timeoutSeconds ? raceStartAt + this.state.timeoutSeconds * 1000 : null;

    this.setState({ ...this.state, status: "COUNTDOWN", countdownStartsAt, raceStartAt, raceDeadlineAt });

    await this.schedule(new Date(raceStartAt), "onRaceStart", {});
    if (raceDeadlineAt) {
      await this.schedule(new Date(raceDeadlineAt), "onRaceTimeout", {});
    }

    const prisma = getPrismaClient(this.env);
    await prisma.race.update({
      where: { id: this.state.raceId },
      data: { status: "COUNTDOWN", countdownStartedAt: new Date(countdownStartsAt) },
    });
  }

  async onRaceStart() {
    if (this.state.status !== "COUNTDOWN") return;
    this.setState({ ...this.state, status: "ACTIVE" });
    this.broadcast(JSON.stringify({ type: "RACE_STARTED", raceStartAt: this.state.raceStartAt }));

    const prisma = getPrismaClient(this.env);
    await prisma.race.update({
      where: { id: this.state.raceId },
      data: { status: "ACTIVE", raceStartedAt: new Date(this.state.raceStartAt!) },
    });
  }

  async onRaceTimeout() {
    if (this.state.status !== "ACTIVE") return;
    await this.finalizeRace("timeout");
  }

  onConnect(conn: Connection, ctx: ConnectionContext) {
    const userId = new URL(ctx.request.url).searchParams.get("userId");
    if (!userId || !this.state.racers[userId]) {
      conn.close(4001, "Unknown participant");
      return;
    }
    conn.serializeAttachment({ userId });
  }

  onClose(conn: Connection) {
    const attachment = conn.deserializeAttachment() as { userId?: string } | null;
    const userId = attachment?.userId;
    if (!userId) return;
    const racer = this.state.racers[userId];
    if (racer && racer.status !== "FINISHED") {
      this.setState({
        ...this.state,
        racers: { ...this.state.racers, [userId]: { ...racer, status: "DISCONNECTED" } },
      });
    }
  }

  async onMessage(conn: Connection, message: WSMessage) {
    if (typeof message !== "string") return;
    let msg: { type: string; lat?: number; lng?: number; speedKmh?: number };
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }
    if (msg.type !== "POSITION_UPDATE" || this.state.status !== "ACTIVE") return;
    if (typeof msg.lat !== "number" || typeof msg.lng !== "number") return;

    const attachment = conn.deserializeAttachment() as { userId?: string } | null;
    const userId = attachment?.userId;
    if (!userId) return;

    const racer = this.state.racers[userId];
    if (!racer || racer.status === "FINISHED") return;

    const { lat, lng } = msg;
    const speedKmh = typeof msg.speedKmh === "number" ? msg.speedKmh : 0;

    const distToFinish = haversineMeters(lat, lng, this.state.endLat, this.state.endLng);
    const stepDistance = haversineMeters(racer.lat, racer.lng, lat, lng);

    const updatedRacer: RacerLiveState = {
      ...racer,
      lat,
      lng,
      speedKmh,
      lastUpdateAt: Date.now(),
      distanceTraveled: racer.distanceTraveled + stepDistance,
      status: "RACING",
    };

    if (distToFinish <= this.state.finishRadiusMeters) {
      updatedRacer.status = "FINISHED";
      updatedRacer.finishedAt = Date.now();
      updatedRacer.elapsedMs = updatedRacer.finishedAt - (this.state.raceStartAt ?? updatedRacer.finishedAt);
    }

    this.setState({ ...this.state, racers: { ...this.state.racers, [userId]: updatedRacer } });

    if (updatedRacer.status === "FINISHED") {
      await this.persistFinish(userId, updatedRacer);
      const allDone = Object.values(this.state.racers).every(
        (r) => r.status === "FINISHED" || r.status === "DISCONNECTED"
      );
      if (allDone) await this.finalizeRace("all_finished");
    }
  }

  private async persistFinish(userId: string, racer: RacerLiveState) {
    const prisma = getPrismaClient(this.env);
    const finishedCount = Object.values(this.state.racers).filter((r) => r.status === "FINISHED").length;
    const participant = await prisma.raceParticipant.findFirstOrThrow({
      where: { raceId: this.state.raceId, userId },
    });

    await prisma.raceResult.create({
      data: {
        raceId: this.state.raceId,
        participantId: participant.id,
        userId,
        finishedAt: new Date(racer.finishedAt!),
        elapsedMs: racer.elapsedMs!,
        rank: finishedCount,
        finalDistanceMeters: racer.distanceTraveled,
        averageSpeedKmh: racer.elapsedMs ? racer.distanceTraveled / 1000 / (racer.elapsedMs / 3_600_000) : null,
      },
    });
    await prisma.raceParticipant.update({ where: { id: participant.id }, data: { status: "FINISHED" } });

    this.broadcast(
      JSON.stringify({ type: "RACER_FINISHED", userId, elapsedMs: racer.elapsedMs, rank: finishedCount })
    );
  }

  private async finalizeRace(reason: "timeout" | "all_finished") {
    if (this.state.status === "FINISHED") return;

    if (reason === "timeout") {
      const prisma = getPrismaClient(this.env);
      for (const racer of Object.values(this.state.racers)) {
        if (racer.status === "FINISHED") continue; // already has a RaceResult from persistFinish
        const participant = await prisma.raceParticipant.findFirst({
          where: { raceId: this.state.raceId, userId: racer.userId },
        });
        if (!participant) continue;
        await prisma.raceResult.create({
          data: {
            raceId: this.state.raceId,
            participantId: participant.id,
            userId: racer.userId,
            didNotFinish: true,
            finalDistanceMeters: racer.distanceTraveled,
          },
        });
        await prisma.raceParticipant.update({ where: { id: participant.id }, data: { status: "DISCONNECTED" } });
      }
    }

    this.setState({ ...this.state, status: "FINISHED" });
    this.broadcast(JSON.stringify({ type: "RACE_FINISHED", reason }));

    const prisma = getPrismaClient(this.env);
    await prisma.race.update({
      where: { id: this.state.raceId },
      data: { status: "FINISHED", raceEndedAt: new Date() },
    });
  }
}
