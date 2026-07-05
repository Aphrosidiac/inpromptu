import { useCallback, useState } from "react";
import { useAgent } from "agents/react";
import { SOCKET_HOST } from "../lib/api";
import type { RaceRoomState } from "../types/race";

export type RaceRoomEvent =
  | { type: "RACE_STARTED"; raceStartAt: number }
  | { type: "RACER_FINISHED"; userId: string; elapsedMs: number; rank: number }
  | { type: "RACE_FINISHED"; reason: "timeout" | "all_finished" };

export function useRaceRoomAgent(raceId: string, userId: string, onEvent?: (event: RaceRoomEvent) => void) {
  const [state, setState] = useState<RaceRoomState | null>(null);

  const agent = useAgent<RaceRoomState>({
    agent: "race-room-agent",
    basePath: `api/races/${raceId}/live`,
    host: SOCKET_HOST,
    query: { userId },
    onStateUpdate: (next) => setState(next),
    onMessage: (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed?.type === "RACER_FINISHED" || parsed?.type === "RACE_STARTED" || parsed?.type === "RACE_FINISHED") {
          onEvent?.(parsed as RaceRoomEvent);
        }
      } catch {
        // non-JSON / internal protocol messages -- ignore
      }
    },
  });

  const sendPosition = useCallback(
    (lat: number, lng: number, speedKmh: number) => {
      agent.send(JSON.stringify({ type: "POSITION_UPDATE", lat, lng, speedKmh }));
    },
    [agent]
  );

  return { state, sendPosition };
}
