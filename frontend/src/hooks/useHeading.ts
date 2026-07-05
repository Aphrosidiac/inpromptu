import { useEffect, useRef, useState } from "react";
import { computeBearing } from "../lib/bearing";
import { haversineMeters } from "../lib/haversine";

const JITTER_THRESHOLD_M = 2;

// Derives a stable compass heading from consecutive GPS fixes, ignoring tiny jitter moves
// (GPS noise while stationary) that would otherwise make the heading flicker randomly.
export function useHeading(lat: number | undefined, lng: number | undefined) {
  const [heading, setHeading] = useState(0);
  const prevPos = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (lat == null || lng == null) return;
    const prev = prevPos.current;
    if (prev && haversineMeters(prev.lat, prev.lng, lat, lng) >= JITTER_THRESHOLD_M) {
      setHeading(computeBearing(prev.lat, prev.lng, lat, lng));
    }
    prevPos.current = { lat, lng };
  }, [lat, lng]);

  return heading;
}
