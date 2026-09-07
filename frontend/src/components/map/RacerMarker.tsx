import { useMemo } from "react";
import L from "leaflet";
import { resolveImageUrl } from "../../lib/api";
import { colorFor, initialFor } from "../../lib/avatarColor";
import { escapeHtml } from "../../lib/escapeHtml";
import { AnimatedMarker } from "./AnimatedMarker";
import type { RacerLiveState } from "../../types/race";

const STATUS_RING: Record<RacerLiveState["status"], string> = {
  LOBBY: "#9a9aa2",
  READY: "#9a9aa2",
  RACING: "#c6ff4d",
  FINISHED: "#34d399",
  DISCONNECTED: "#ff6b6b",
};

const SIZE = 34;

function createAvatarIcon(status: RacerLiveState["status"], photoUrl: string | undefined, displayName: string) {
  const ring = STATUS_RING[status];
  const resolvedPhoto = resolveImageUrl(photoUrl);
  const inner = resolvedPhoto
    ? `<img src="${resolvedPhoto}" style="width:100%;height:100%;object-fit:cover;border-radius:9999px;" />`
    : `<div style="width:100%;height:100%;border-radius:9999px;display:flex;align-items:center;justify-content:center;background:${colorFor(
        displayName
      )}33;color:${colorFor(displayName)};font-weight:600;font-size:13px;">${escapeHtml(initialFor(displayName))}</div>`;

  return L.divIcon({
    className: "",
    html: `<div style="width:${SIZE}px;height:${SIZE}px;border-radius:9999px;padding:2px;background:${ring};box-shadow:0 2px 6px rgba(0,0,0,0.5);">${inner}</div>`,
    iconSize: [SIZE, SIZE],
    iconAnchor: [SIZE / 2, SIZE / 2],
  });
}

// Other racers render as small avatar-circle markers (their car photo, or initials) -- the
// current user gets the larger directional MeMarker chevron instead, matching Waze's
// distinction between "you" and other drivers on the map. The icon is memoized on only the
// props that actually change its appearance -- lat/lng/speed update far more often than
// status or photo, and rebuilding (and having Leaflet swap) the whole icon DOM node on
// every position tick was a real source of jank once a few racers were on screen.
export function RacerMarker({ racer }: { racer: RacerLiveState }) {
  const icon = useMemo(
    () => createAvatarIcon(racer.status, racer.carPhotoUrl, racer.displayName),
    [racer.status, racer.carPhotoUrl, racer.displayName]
  );
  const tooltipHtml = `${escapeHtml(racer.displayName)}${
    racer.carName ? ` · ${escapeHtml(racer.carName)}` : ""
  } · ${racer.speedKmh.toFixed(1)} km/h`;

  return (
    <AnimatedMarker
      position={{ lat: racer.lat, lng: racer.lng }}
      icon={icon}
      tooltipHtml={tooltipHtml}
      tooltipOffset={[0, -SIZE / 2]}
    />
  );
}
