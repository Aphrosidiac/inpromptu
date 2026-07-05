import L from "leaflet";
import { Marker, Polyline } from "react-leaflet";
import type { LatLng } from "../../types/race";

const startIcon = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;border-radius:9999px;background:var(--color-accent);border:3px solid var(--color-bg);box-shadow:0 0 0 2px rgba(198,255,77,0.35),0 2px 8px rgba(0,0,0,0.5);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const finishIcon = L.divIcon({
  className: "",
  html: `<div style="width:26px;height:26px;border-radius:9999px;background:#fff;border:3px solid var(--color-bg);box-shadow:0 2px 8px rgba(0,0,0,0.5);display:grid;grid-template-columns:1fr 1fr;overflow:hidden;">
    <div style="background:#08090b"></div><div style="background:#fff"></div>
    <div style="background:#fff"></div><div style="background:#08090b"></div>
  </div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

export function RouteLine({ waypoints }: { waypoints: LatLng[] }) {
  if (waypoints.length === 0) return null;
  const positions = waypoints.map((w) => [w.lat, w.lng] as [number, number]);
  const start = waypoints[0];
  const end = waypoints[waypoints.length - 1];

  return (
    <>
      {/* Soft outer glow */}
      <Polyline positions={positions} pathOptions={{ color: "#c6ff4d", weight: 16, opacity: 0.18 }} />
      {/* White casing (the "halo" that makes the route read as a thick, glowing line) */}
      <Polyline positions={positions} pathOptions={{ color: "#ffffff", weight: 8, opacity: 0.9 }} />
      {/* Core route line */}
      <Polyline positions={positions} pathOptions={{ color: "#c6ff4d", weight: 4, opacity: 1 }} />
      {start && <Marker position={[start.lat, start.lng]} icon={startIcon} />}
      {end && <Marker position={[end.lat, end.lng]} icon={finishIcon} />}
    </>
  );
}
