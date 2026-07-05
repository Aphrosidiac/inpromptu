import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X } from "@phosphor-icons/react";
import { useAuth } from "../hooks/useAuth";
import { useRaceRoomAgent, type RaceRoomEvent } from "../hooks/useRaceRoomAgent";
import { useGeolocation } from "../hooks/useGeolocation";
import { useWakeLock } from "../hooks/useWakeLock";
import { useToast } from "../components/ui/Toast";
import { racesApi } from "../lib/races";
import { LeafletMap } from "../components/map/LeafletMap";
import { RouteLine } from "../components/map/RouteLine";
import { RacerMarker } from "../components/map/RacerMarker";
import { CountdownOverlay } from "../components/race/CountdownOverlay";
import { SpeedHud } from "../components/race/SpeedHud";
import type { Race } from "../types/race";

export function LiveRacePage() {
  const { raceId } = useParams<{ raceId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [race, setRace] = useState<Race | null>(null);

  const handleEvent = useCallback(
    (event: RaceRoomEvent) => {
      if (event.type === "RACER_FINISHED" && event.userId !== user?.id) {
        toast.show(`Racer finished - rank #${event.rank}`, "finish");
      }
    },
    [toast, user?.id]
  );

  const { state, sendPosition } = useRaceRoomAgent(raceId!, user!.id, handleEvent);
  const isActive = state?.status === "ACTIVE";
  const { speedKmh, position } = useGeolocation(isActive);
  useWakeLock(isActive);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!raceId) return;
    racesApi.get(raceId).then(setRace);
  }, [raceId]);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    if (state?.status === "FINISHED") navigate(`/races/${raceId}/results`);
  }, [state?.status, raceId, navigate]);

  useEffect(() => {
    if (isActive && position) sendPosition(position.lat, position.lng, speedKmh);
  }, [isActive, position, speedKmh, sendPosition]);

  if (!race || !state) return <div className="safe-top flex min-h-[100dvh] items-center justify-center text-text-muted">Loading...</div>;

  const racers = Object.values(state.racers);
  const elapsedMs = state.raceStartAt ? now - state.raceStartAt : 0;

  return (
    <div className="relative min-h-[100dvh]">
      {state.status === "COUNTDOWN" && state.countdownStartsAt != null && (
        <CountdownOverlay raceStartAt={state.countdownStartsAt + 3000} />
      )}
      <LeafletMap center={{ lat: race.startLat, lng: race.startLng }} height="100dvh">
        <RouteLine waypoints={race.waypoints} />
        {racers.map((r) => (
          <RacerMarker key={r.userId} racer={r} />
        ))}
      </LeafletMap>
      <button
        onClick={() => navigate("/")}
        aria-label="Leave race"
        className="glass safe-top fixed right-4 top-4 z-[1100] flex h-11 w-11 items-center justify-center rounded-full text-text"
      >
        <X size={20} />
      </button>
      {isActive && <SpeedHud speedKmh={speedKmh} elapsedMs={elapsedMs} />}
    </div>
  );
}
