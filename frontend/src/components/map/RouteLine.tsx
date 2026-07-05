import { Marker, Polyline } from "react-leaflet";
import type { LatLng } from "../../types/race";

export function RouteLine({ waypoints }: { waypoints: LatLng[] }) {
  if (waypoints.length === 0) return null;
  const positions = waypoints.map((w) => [w.lat, w.lng] as [number, number]);
  const start = waypoints[0];
  const end = waypoints[waypoints.length - 1];

  return (
    <>
      <Polyline positions={positions} pathOptions={{ color: "#4f46e5", dashArray: "6 6" }} />
      {start && <Marker position={[start.lat, start.lng]} />}
      {end && <Marker position={[end.lat, end.lng]} />}
    </>
  );
}
