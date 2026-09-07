import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X, Crosshair } from "@phosphor-icons/react";
import { useAuth } from "../hooks/useAuth";
import { useRaceRoomAgent, type RaceRoomEvent } from "../hooks/useRaceRoomAgent";
import { useGeolocation } from "../hooks/useGeolocation";
import { useWakeLock } from "../hooks/useWakeLock";
import { useHeading } from "../hooks/useHeading";
import { useToast } from "../components/ui/Toast";
import { Button } from "../components/ui/Button";
import { racesApi } from "../lib/races";
import { computeBearing } from "../lib/bearing";
import { haversineMeters } from "../lib/haversine";
import { LeafletMap } from "../components/map/LeafletMap";
import { RouteLine } from "../components/map/RouteLine";
import { RacerMarker } from "../components/map/RacerMarker";
import { MeMarker } from "../components/map/MeMarker";
import { FollowMe } from "../components/map/FollowMe";
import { CountdownOverlay } from "../components/race/CountdownOverlay";
import { LiveRaceSheet } from "../components/race/LiveRaceSheet";
import { TopInstructionBar } from "../components/race/TopInstructionBar";
import type { Race } from "../types/race";

export function LiveRacePage() {
  const { raceId } = useParams<{ raceId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [race, setRace] = useState<Race | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

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
  const heading = useHeading(position?.lat, position?.lng);
  useWakeLock(isActive);
  const [now, setNow] = useState(() => Date.now());
  const [following, setFollowing] = useState(true);
  const [recenterSignal, setRecenterSignal] = useState(0);

  useEffect(() => {
    if (!raceId) return;
    racesApi.get(raceId).then(setRace).catch(() => setLoadFailed(true));
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

  if (loadFailed) {
    return (
      <div className="safe-top flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-5 text-center">
        <p className="text-text-muted">Couldn't load this race. Check your connection and try again.</p>
        <Button onClick={() => navigate("/")}>Back to races</Button>
      </div>
    );
  }
  if (!race || !state) return <div className="safe-top flex min-h-[100dvh] items-center justify-center text-text-muted">Loading...</div>;

  const otherRacers = Object.values(state.racers).filter((r) => r.userId !== user?.id);
  const elapsedMs = state.raceStartAt ? now - state.raceStartAt : 0;

  const distanceToFinish = position ? haversineMeters(position.lat, position.lng, race.endLat, race.endLng) : null;
  const bearingToFinish = position ? computeBearing(position.lat, position.lng, race.endLat, race.endLng) : null;
  const relativeBearing = bearingToFinish != null ? (bearingToFinish - heading + 360) % 360 : 0;

  return (
    <div className="relative min-h-[100dvh]">
      {state.status === "COUNTDOWN" && state.countdownStartsAt != null && (
        <CountdownOverlay raceStartAt={state.countdownStartsAt + 3000} />
      )}
      <LeafletMap center={{ lat: race.startLat, lng: race.startLng }} height="100dvh">
        <RouteLine waypoints={race.waypoints} />
        {otherRacers.map((r) => (
          <RacerMarker key={r.userId} racer={r} />
        ))}
        {isActive && position && <MeMarker lat={position.lat} lng={position.lng} heading={heading} />}
        {isActive && position && (
          <FollowMe position={position} recenterSignal={recenterSignal} onFollowingChange={setFollowing} />
        )}
      </LeafletMap>

      {isActive && distanceToFinish != null && (
        <TopInstructionBar distanceMeters={distanceToFinish} relativeBearing={relativeBearing} />
      )}

      <button
        onClick={() => navigate("/")}
        aria-label="Leave race"
        className="glass safe-top fixed right-4 top-4 z-[1100] flex h-11 w-11 items-center justify-center rounded-full text-text"
      >
        <X size={20} />
      </button>

      {isActive && !following && (
        <button
          onClick={() => setRecenterSignal((n) => n + 1)}
          aria-label="Recenter on my location"
          className="glass safe-top fixed right-4 top-20 z-[1100] flex h-11 w-11 items-center justify-center rounded-full text-accent"
        >
          <Crosshair size={20} weight="bold" />
        </button>
      )}
      {isActive && (
        <LiveRaceSheet
          raceId={raceId!}
          racers={Object.values(state.racers)}
          currentUserId={user?.id}
          speedKmh={speedKmh}
          elapsedMs={elapsedMs}
        />
      )}
    </div>
  );
}
