import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapTrifold } from "@phosphor-icons/react";
import { useAuth } from "../hooks/useAuth";
import { useGeolocation } from "../hooks/useGeolocation";
import { useHeading } from "../hooks/useHeading";
import { useNearbyAgent } from "../hooks/useNearbyAgent";
import { racesApi } from "../lib/races";
import { LeafletMap } from "../components/map/LeafletMap";
import { MeMarker } from "../components/map/MeMarker";
import { NearbyMarker } from "../components/map/NearbyMarker";
import { Button } from "../components/ui/Button";
import type { Race } from "../types/race";

// Nearby users stop rendering once their last position sample is this old -- onClose doesn't
// always fire cleanly (backgrounded tab, network drop, killed app), so without this a user who
// vanished ungracefully would appear frozen on the map forever.
const STALE_MS = 2 * 60 * 1000;

export function MapPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeRace, setActiveRace] = useState<Race | null | undefined>(undefined);

  useEffect(() => {
    racesApi
      .list()
      .then((races) => {
        const active = races.find((r) => r.status === "ACTIVE" || r.status === "COUNTDOWN");
        setActiveRace(active ?? null);
      })
      .catch(() => setActiveRace(null));
  }, []);

  useEffect(() => {
    if (activeRace) navigate(`/races/${activeRace.id}/live`, { replace: true });
  }, [activeRace, navigate]);

  if (activeRace === undefined || activeRace) {
    return <div className="safe-top flex min-h-[100dvh] items-center justify-center text-text-muted">Loading...</div>;
  }

  return user?.shareLocation ? <LiveNearbyMap /> : <ShareLocationPrompt />;
}

function ShareLocationPrompt() {
  const { updateShareLocation } = useAuth();
  const [isEnabling, setIsEnabling] = useState(false);

  async function handleEnable() {
    setIsEnabling(true);
    try {
      await updateShareLocation(true);
    } finally {
      setIsEnabling(false);
    }
  }

  return (
    <div className="safe-top flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-8 text-center">
      <MapTrifold size={40} className="text-text-muted" />
      <h1 className="text-xl font-semibold text-text">See racers near you</h1>
      <p className="text-[14px] text-text-muted">
        Turn on live location sharing to see other Inpromptu racers nearby on the map, and let them see you. You
        can turn this off anytime.
      </p>
      <Button disabled={isEnabling} onClick={handleEnable}>
        {isEnabling ? "Turning on..." : "Share my live location"}
      </Button>
    </div>
  );
}

function LiveNearbyMap() {
  const { updateShareLocation } = useAuth();
  const { position, speedKmh, error: geoError } = useGeolocation(true);
  const heading = useHeading(position?.lat, position?.lng);
  const { state, sendPosition } = useNearbyAgent();
  const [isDisabling, setIsDisabling] = useState(false);

  useEffect(() => {
    if (position) sendPosition(position.lat, position.lng, speedKmh);
  }, [position, speedKmh, sendPosition]);

  async function handleDisable() {
    setIsDisabling(true);
    try {
      await updateShareLocation(false);
    } finally {
      setIsDisabling(false);
    }
  }

  if (geoError) {
    return (
      <div className="safe-top flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-text-muted">Couldn't get your location: {geoError}</p>
        <Button variant="glass" disabled={isDisabling} onClick={handleDisable}>
          Turn off sharing
        </Button>
      </div>
    );
  }
  if (!position) {
    return (
      <div className="safe-top flex min-h-[100dvh] items-center justify-center text-text-muted">
        Getting your location...
      </div>
    );
  }

  const now = Date.now();
  const nearbyUsers = state ? Object.values(state.users).filter((u) => now - u.lastUpdateAt < STALE_MS) : [];

  return (
    <div className="relative min-h-[100dvh]">
      <LeafletMap center={position} zoom={15} height="100dvh">
        {nearbyUsers.map((u) => (
          <NearbyMarker key={u.userId} user={u} />
        ))}
        <MeMarker lat={position.lat} lng={position.lng} heading={heading} />
      </LeafletMap>

      <div className="glass safe-top fixed inset-x-4 top-4 z-[1000] flex items-center justify-between rounded-card px-4 py-3">
        <span className="text-[13px] text-text-muted">
          {nearbyUsers.length} {nearbyUsers.length === 1 ? "racer" : "racers"} nearby
        </span>
        <button
          onClick={handleDisable}
          disabled={isDisabling}
          className="text-[13px] font-medium text-danger disabled:opacity-40"
        >
          {isDisabling ? "..." : "Stop sharing"}
        </button>
      </div>
    </div>
  );
}
