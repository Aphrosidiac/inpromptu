export type RaceMode = "RANDOM_ROUTE" | "PIN_DROP";
export type RaceStatus = "DRAFT" | "LOBBY" | "COUNTDOWN" | "ACTIVE" | "FINISHED" | "CANCELLED";
export type ParticipantStatus = "JOINED" | "READY" | "RACING" | "FINISHED" | "DISCONNECTED";

export type LatLng = { lat: number; lng: number };

export type ActiveCar = { id: string; name: string; photoUrl: string | null };

export type RaceParticipant = {
  id: string;
  raceId: string;
  userId: string;
  status: ParticipantStatus;
  joinedAt: string;
  user?: { id: string; displayName: string; cars?: ActiveCar[] };
};

export type Race = {
  id: string;
  hostId: string;
  mode: RaceMode;
  status: RaceStatus;
  name: string;
  distanceMeters: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  waypoints: LatLng[];
  finishRadiusMeters: number;
  timeoutSeconds: number | null;
  countdownStartedAt: string | null;
  raceStartedAt: string | null;
  raceEndedAt: string | null;
  createdAt: string;
  participants: RaceParticipant[];
};

export type RaceResult = {
  id: string;
  raceId: string;
  participantId: string;
  userId: string;
  finishedAt: string | null;
  elapsedMs: number | null;
  rank: number | null;
  didNotFinish: boolean;
  finalDistanceMeters: number;
  averageSpeedKmh: number | null;
  participant: { user: { id: string; displayName: string } };
};

// Mirrors backend/src/agents/RaceRoomAgent.ts RaceRoomState/RacerLiveState.
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
  waypoints: LatLng[];
  finishRadiusMeters: number;
  timeoutSeconds: number | null;
  countdownStartsAt: number | null;
  raceStartAt: number | null;
  raceDeadlineAt: number | null;
  racers: Record<string, RacerLiveState>;
};
