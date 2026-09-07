import { useEffect, useRef, useState } from "react";
import { haversineMeters } from "../lib/haversine";

type Sample = { lat: number; lng: number; t: number };

const SAMPLE_HISTORY_SIZE = 5;
const MIN_SAMPLE_INTERVAL_MS = 500;

// How much the displayed position moves toward each new raw GPS fix (0-1). Low enough to
// damp typical GPS noise (a few meters of wobble while stationary or moving in a straight
// line), high enough not to visibly lag behind real movement given ~500ms sample spacing.
const SMOOTHING_ALPHA = 0.4;

// A jump this large can't be GPS noise -- it's a real position change (the very first fix,
// or a fresh fix after a signal gap). Snap straight to it instead of smoothing, or the
// display would visibly lag behind actual movement.
const SNAP_THRESHOLD_METERS = 40;

export type GeolocationError = { message: string; permissionDenied: boolean };

export function useGeolocation(enabled: boolean) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [error, setError] = useState<GeolocationError | null>(null);
  const history = useRef<Sample[]>([]);
  const lastSampleAt = useRef(0);
  const smoothed = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSampleAt.current < MIN_SAMPLE_INTERVAL_MS) return;
        lastSampleAt.current = now;

        const raw = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const sample: Sample = { ...raw, t: now };
        history.current.push(sample);
        if (history.current.length > SAMPLE_HISTORY_SIZE) history.current.shift();

        // Raw GPS fixes wobble by several meters even standing still -- feeding them
        // straight into the map marker makes it visibly shake. Exponentially smoothing
        // toward each new fix (with a snap-through for jumps too large to be noise)
        // damps that wobble while still tracking real movement closely.
        const prevSmoothed = smoothed.current;
        const next =
          !prevSmoothed || haversineMeters(prevSmoothed.lat, prevSmoothed.lng, raw.lat, raw.lng) > SNAP_THRESHOLD_METERS
            ? raw
            : {
                lat: prevSmoothed.lat + SMOOTHING_ALPHA * (raw.lat - prevSmoothed.lat),
                lng: prevSmoothed.lng + SMOOTHING_ALPHA * (raw.lng - prevSmoothed.lng),
              };
        smoothed.current = next;
        setPosition(next);

        // Speed smoothing: derive from consecutive raw position/timestamp deltas rather
        // than trusting the often-null/noisy `coords.speed` value directly.
        if (history.current.length >= 2) {
          const speeds: number[] = [];
          for (let i = 1; i < history.current.length; i++) {
            const a = history.current[i - 1]!;
            const b = history.current[i]!;
            const dtHours = (b.t - a.t) / 3_600_000;
            if (dtHours <= 0) continue;
            const distKm = haversineMeters(a.lat, a.lng, b.lat, b.lng) / 1000;
            speeds.push(distKm / dtHours);
          }
          if (speeds.length) setSpeedKmh(speeds.reduce((sum, s) => sum + s, 0) / speeds.length);
        }
      },
      (err) => setError({ message: err.message, permissionDenied: err.code === err.PERMISSION_DENIED }),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      history.current = [];
      smoothed.current = null;
    };
  }, [enabled]);

  return { position, speedKmh, error };
}
