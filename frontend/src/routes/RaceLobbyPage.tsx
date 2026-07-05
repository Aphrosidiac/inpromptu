import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CaretLeft, Link as LinkIcon, MapTrifold, Users } from "@phosphor-icons/react";
import { useAuth } from "../hooks/useAuth";
import { useRaceRoomAgent } from "../hooks/useRaceRoomAgent";
import { useToast } from "../components/ui/Toast";
import { racesApi } from "../lib/races";
import { ApiError } from "../lib/api";
import { GlassCard } from "../components/ui/GlassCard";
import { PageFade } from "../components/ui/PageFade";
import { Button } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import { BottomSheet } from "../components/ui/BottomSheet";
import { LeafletMap } from "../components/map/LeafletMap";
import { RouteLine } from "../components/map/RouteLine";
import type { Race } from "../types/race";

function previewZoomFor(distanceMeters: number) {
  if (distanceMeters < 1000) return 15;
  if (distanceMeters < 3000) return 14;
  if (distanceMeters < 6000) return 13;
  return 12;
}

export function RaceLobbyPage() {
  const { raceId } = useParams<{ raceId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [race, setRace] = useState<Race | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSoloConfirm, setShowSoloConfirm] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const seenRacers = useRef<Set<string> | null>(null);

  const { state } = useRaceRoomAgent(raceId!, user!.id);

  useEffect(() => {
    if (!raceId) return;
    racesApi.get(raceId).then(setRace).catch(() => setLoadFailed(true));
  }, [raceId]);

  useEffect(() => {
    if (!state) return;
    const currentIds = new Set(Object.keys(state.racers));
    if (seenRacers.current) {
      for (const id of currentIds) {
        if (!seenRacers.current.has(id) && id !== user?.id) {
          toast.show(`${state.racers[id]?.displayName ?? "Someone"} joined`, "success");
        }
      }
    }
    seenRacers.current = currentIds;
  }, [state, toast, user?.id]);

  useEffect(() => {
    if (state?.status === "COUNTDOWN" || state?.status === "ACTIVE") {
      navigate(`/races/${raceId}/live`);
    }
  }, [state?.status, raceId, navigate]);

  async function startRace() {
    setError(null);
    setIsStarting(true);
    try {
      await racesApi.start(raceId!);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not start the race");
    } finally {
      setIsStarting(false);
      setShowSoloConfirm(false);
    }
  }

  function handleStartClick() {
    const racers = state ? Object.values(state.racers) : [];
    const racerCount = racers.length || (race?.participants.length ?? 0);
    if (racerCount < 2) {
      setShowSoloConfirm(true);
      return;
    }
    startRace();
  }

  async function handleShare() {
    const url = `${window.location.origin}/join/${raceId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.show("Invite link copied", "success");
    } catch {
      toast.show(url, "info");
    }
  }

  if (loadFailed) {
    return (
      <div className="safe-top flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-5 text-center">
        <p className="text-text-muted">Couldn't load this race. Check your connection and try again.</p>
        <Button onClick={() => navigate("/")}>Back to races</Button>
      </div>
    );
  }
  if (!race) return <div className="safe-top flex min-h-[100dvh] items-center justify-center text-text-muted">Loading...</div>;

  const isHost = race.hostId === user?.id;
  const racers = state ? Object.values(state.racers) : [];

  return (
    <PageFade className="safe-top safe-bottom flex min-h-[100dvh] flex-col px-5 pt-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/")} aria-label="Leave lobby">
          <CaretLeft size={22} className="text-text-muted" />
        </button>
        <h1 className="text-2xl font-semibold text-text">{race.name}</h1>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[13px] text-text-muted">
        <MapTrifold size={16} />
        {(race.distanceMeters / 1000).toFixed(1)} km
        <span>·</span>
        waiting for host
      </div>
      {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-card">
        <LeafletMap
          center={{ lat: (race.startLat + race.endLat) / 2, lng: (race.startLng + race.endLng) / 2 }}
          zoom={previewZoomFor(race.distanceMeters)}
          height="200px"
        >
          <RouteLine waypoints={race.waypoints} />
        </LeafletMap>
      </div>

      <GlassCard className="mt-4">
        <div className="mb-3 flex items-center gap-2 text-[13px] font-medium text-text-muted">
          <Users size={16} />
          Racers ({racers.length || race.participants.length})
        </div>
        <div className="flex flex-col gap-3">
          {(racers.length > 0
            ? racers.map((r) => ({ id: r.userId, name: r.displayName, carName: r.carName, carPhotoUrl: r.carPhotoUrl }))
            : race.participants.map((p) => ({
                id: p.userId,
                name: p.user?.displayName ?? "Racer",
                carName: p.user?.cars?.[0]?.name,
                carPhotoUrl: p.user?.cars?.[0]?.photoUrl ?? undefined,
              }))
          ).map((r) => (
            <div key={r.id} className="flex items-center gap-3">
              <Avatar name={r.name} imageUrl={r.carPhotoUrl} />
              <div className="flex flex-col">
                <span className="text-[15px] text-text">{r.name}</span>
                {r.carName && <span className="text-[12px] text-text-muted">{r.carName}</span>}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <Button variant="glass" icon={<LinkIcon size={18} />} onClick={handleShare} className="mt-4">
        Copy invite link
      </Button>

      <div className="flex-1" />

      {isHost ? (
        <Button size="lg" fullWidth onClick={handleStartClick} className="mb-4">
          Start race
        </Button>
      ) : (
        <p className="mb-6 text-center text-[14px] text-text-muted">Waiting for the host to start the race...</p>
      )}

      <BottomSheet open={showSoloConfirm} onClose={() => setShowSoloConfirm(false)} title="Start race alone?">
        <p className="mb-5 text-[14px] text-text-muted">
          No one else has joined yet. You can still start and race solo against the clock.
        </p>
        <div className="flex gap-3">
          <Button variant="glass" fullWidth onClick={() => setShowSoloConfirm(false)}>
            Cancel
          </Button>
          <Button fullWidth disabled={isStarting} onClick={startRace}>
            {isStarting ? "Starting..." : "Start alone"}
          </Button>
        </div>
      </BottomSheet>
    </PageFade>
  );
}
