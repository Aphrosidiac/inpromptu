import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapTrifold, MapPinLine } from "@phosphor-icons/react";
import clsx from "clsx";
import { DistancePicker } from "../components/race/DistancePicker";
import { PinDropModal } from "../components/map/PinDropModal";
import { GlassCard } from "../components/ui/GlassCard";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { racesApi } from "../lib/races";
import { ApiError } from "../hooks/useAuth";
import type { LatLng } from "../types/race";

const DEFAULT_CENTER: LatLng = { lat: 1.4927, lng: 103.7414 }; // fallback if geolocation is unavailable

export function CreateRacePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"RANDOM_ROUTE" | "PIN_DROP">("RANDOM_ROUTE");
  const [name, setName] = useState("");
  const [distanceMeters, setDistanceMeters] = useState(5000);
  const [center, setCenter] = useState<LatLng>(DEFAULT_CENTER);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pins, setPins] = useState<{ start: LatLng; end: LatLng } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // keep default center if denied/unavailable
    );
  }, []);

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Give your race a name");
      return;
    }
    if (mode === "PIN_DROP" && !pins) {
      setError("Drop a start and finish pin first");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const race =
        mode === "RANDOM_ROUTE"
          ? await racesApi.create({
              mode: "RANDOM_ROUTE",
              name,
              distanceMeters,
              originLat: center.lat,
              originLng: center.lng,
            })
          : await racesApi.create({
              mode: "PIN_DROP",
              name,
              startLat: pins!.start.lat,
              startLng: pins!.start.lng,
              endLat: pins!.end.lat,
              endLng: pins!.end.lng,
            });
      navigate(`/races/${race.id}/lobby`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create race");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="safe-top flex flex-col gap-5 px-5 pt-6">
      <h1 className="text-2xl font-semibold text-text">Create a race</h1>
      {error && <p className="text-[13px] text-danger">{error}</p>}

      <Input placeholder="Sunday morning sprint" label="Race name" value={name} onChange={(e) => setName(e.target.value)} />

      <div className="glass flex rounded-button p-1">
        <button
          onClick={() => setMode("RANDOM_ROUTE")}
          className={clsx(
            "flex flex-1 items-center justify-center gap-1.5 rounded-button py-2.5 text-[14px] font-medium transition-colors",
            mode === "RANDOM_ROUTE" ? "bg-accent text-accent-foreground" : "text-text-muted"
          )}
        >
          <MapTrifold size={17} weight={mode === "RANDOM_ROUTE" ? "fill" : "regular"} />
          Random route
        </button>
        <button
          onClick={() => setMode("PIN_DROP")}
          className={clsx(
            "flex flex-1 items-center justify-center gap-1.5 rounded-button py-2.5 text-[14px] font-medium transition-colors",
            mode === "PIN_DROP" ? "bg-accent text-accent-foreground" : "text-text-muted"
          )}
        >
          <MapPinLine size={17} weight={mode === "PIN_DROP" ? "fill" : "regular"} />
          Drop pins
        </button>
      </div>

      {mode === "RANDOM_ROUTE" && (
        <GlassCard>
          <DistancePicker distanceMeters={distanceMeters} onChange={setDistanceMeters} />
        </GlassCard>
      )}

      {mode === "PIN_DROP" && (
        <GlassCard className="flex flex-col gap-3">
          <Button variant="glass" icon={<MapPinLine size={18} />} onClick={() => setShowPinModal(true)}>
            {pins ? "Change pins" : "Drop start & finish pins"}
          </Button>
          {pins && (
            <p className="text-[13px] text-text-muted">
              Start {pins.start.lat.toFixed(4)}, {pins.start.lng.toFixed(4)} → Finish {pins.end.lat.toFixed(4)},{" "}
              {pins.end.lng.toFixed(4)}
            </p>
          )}
        </GlassCard>
      )}

      <PinDropModal
        open={showPinModal}
        center={center}
        onClose={() => setShowPinModal(false)}
        onConfirm={(start, end) => {
          setPins({ start, end });
          setShowPinModal(false);
        }}
      />

      <Button fullWidth size="lg" disabled={isSubmitting} onClick={handleSubmit}>
        {isSubmitting ? "Creating..." : "Create race"}
      </Button>
    </div>
  );
}
