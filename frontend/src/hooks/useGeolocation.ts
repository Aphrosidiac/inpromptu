import { useEffect, useRef, useState } from "react";
import { haversineMeters } from "../lib/haversine";

type Sample = { lat: number; lng: number; t: number };

const SAMPLE_HISTORY_SIZE = 5;
const MIN_SAMPLE_INTERVAL_MS = 1000;

export function useGeolocation(enabled: boolean) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const history = useRef<Sample[]>([]);
  const lastSampleAt = useRef(0);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSampleAt.current < MIN_SAMPLE_INTERVAL_MS) return;
        lastSampleAt.current = now;

        const sample: Sample = { lat: pos.coords.latitude, lng: pos.coords.longitude, t: now };
        history.current.push(sample);
        if (history.current.length > SAMPLE_HISTORY_SIZE) history.current.shift();

        setPosition({ lat: sample.lat, lng: sample.lng });

        // Speed smoothing: derive from consecutive position/timestamp deltas rather than
        // trusting the often-null/noisy `coords.speed` value directly.
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
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return { position, speedKmh, error };
}
