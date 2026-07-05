import type { RacerLiveState, RaceResult } from "../types/race";

// Derives a rough live-standings view from the realtime socket state (finishers first by
// rank, then still-racing by distance traveled), shaped like the persisted RaceResult so it
// can feed the same LeaderboardTable used for final results.
export function racersToLiveResults(racers: RacerLiveState[], raceId: string): RaceResult[] {
  return racers
    .slice()
    .sort((a, b) => {
      if (a.status === "FINISHED" && b.status === "FINISHED") return (a.rank ?? 0) - (b.rank ?? 0);
      if (a.status === "FINISHED") return -1;
      if (b.status === "FINISHED") return 1;
      return b.distanceTraveled - a.distanceTraveled;
    })
    .map((r) => ({
      id: r.userId,
      raceId,
      participantId: r.userId,
      userId: r.userId,
      finishedAt: r.finishedAt ? new Date(r.finishedAt).toISOString() : null,
      elapsedMs: r.elapsedMs ?? null,
      rank: r.rank ?? null,
      didNotFinish: false,
      finalDistanceMeters: r.distanceTraveled,
      averageSpeedKmh: null,
      participant: { user: { id: r.userId, displayName: r.displayName } },
    }));
}
