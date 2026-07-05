import { CircleMarker, Tooltip } from "react-leaflet";
import type { RacerLiveState } from "../../types/race";

const STATUS_COLORS: Record<RacerLiveState["status"], string> = {
  LOBBY: "#9a9aa2",
  READY: "#9a9aa2",
  RACING: "#c6ff4d",
  FINISHED: "#34d399",
  DISCONNECTED: "#ff6b6b",
};

export function RacerMarker({ racer }: { racer: RacerLiveState }) {
  return (
    <CircleMarker
      center={[racer.lat, racer.lng]}
      radius={8}
      pathOptions={{ color: STATUS_COLORS[racer.status], fillColor: STATUS_COLORS[racer.status], fillOpacity: 0.9 }}
    >
      <Tooltip permanent direction="top" offset={[0, -8]}>
        {racer.displayName}
        {racer.carName ? ` · ${racer.carName}` : ""} · {racer.speedKmh.toFixed(1)} km/h
      </Tooltip>
    </CircleMarker>
  );
}
