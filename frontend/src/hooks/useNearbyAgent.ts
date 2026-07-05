import { useCallback, useState } from "react";
import { useAgent } from "agents/react";
import { SOCKET_HOST } from "../lib/api";
import type { NearbyRoomState } from "../types/race";

// Only ever call this from a component that's conditionally mounted on the user having opted
// in to location sharing -- useAgent doesn't support toggling its connection reactively, so
// the caller controls "connected or not" by controlling whether this hook runs at all.
export function useNearbyAgent() {
  const [state, setState] = useState<NearbyRoomState | null>(null);

  const agent = useAgent<NearbyRoomState>({
    agent: "nearby-agent",
    basePath: "api/nearby/live",
    host: SOCKET_HOST,
    onStateUpdate: (next) => setState(next),
  });

  const sendPosition = useCallback(
    (lat: number, lng: number, speedKmh: number) => {
      agent.send(JSON.stringify({ type: "POSITION_UPDATE", lat, lng, speedKmh }));
    },
    [agent]
  );

  return { state, sendPosition };
}
