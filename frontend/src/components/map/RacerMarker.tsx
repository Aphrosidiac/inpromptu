import L from "leaflet";
import { Marker, Tooltip } from "react-leaflet";
import { resolveImageUrl } from "../../lib/api";
import { colorFor, initialFor } from "../../lib/avatarColor";
import type { RacerLiveState } from "../../types/race";

const STATUS_RING: Record<RacerLiveState["status"], string> = {
  LOBBY: "#9a9aa2",
  READY: "#9a9aa2",
  RACING: "#c6ff4d",
  FINISHED: "#34d399",
  DISCONNECTED: "#ff6b6b",
};

const SIZE = 34;

function createAvatarIcon(racer: RacerLiveState) {
  const ring = STATUS_RING[racer.status];
  const photoUrl = resolveImageUrl(racer.carPhotoUrl);
  const inner = photoUrl
    ? `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:9999px;" />`
    : `<div style="width:100%;height:100%;border-radius:9999px;display:flex;align-items:center;justify-content:center;background:${colorFor(
        racer.displayName
      )}33;color:${colorFor(racer.displayName)};font-weight:600;font-size:13px;">${initialFor(racer.displayName)}</div>`;

  return L.divIcon({
    className: "",
    html: `<div style="width:${SIZE}px;height:${SIZE}px;border-radius:9999px;padding:2px;background:${ring};box-shadow:0 2px 6px rgba(0,0,0,0.5);">${inner}</div>`,
    iconSize: [SIZE, SIZE],
    iconAnchor: [SIZE / 2, SIZE / 2],
  });
}

// Other racers render as small avatar-circle markers (their car photo, or initials) -- the
// current user gets the larger directional MeMarker chevron instead, matching Waze's
// distinction between "you" and other drivers on the map.
export function RacerMarker({ racer }: { racer: RacerLiveState }) {
  const icon = createAvatarIcon(racer);
  return (
    <Marker position={[racer.lat, racer.lng]} icon={icon}>
      <Tooltip direction="top" offset={[0, -SIZE / 2]}>
        {racer.displayName}
        {racer.carName ? ` · ${racer.carName}` : ""} · {racer.speedKmh.toFixed(1)} km/h
      </Tooltip>
    </Marker>
  );
}
