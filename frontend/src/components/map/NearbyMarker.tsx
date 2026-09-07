import { useCallback, useMemo } from "react";
import L from "leaflet";
import { resolveImageUrl } from "../../lib/api";
import { colorFor, initialFor } from "../../lib/avatarColor";
import { escapeHtml } from "../../lib/escapeHtml";
import { AnimatedMarker } from "./AnimatedMarker";
import type { NearbyUserState } from "../../types/race";

const SIZE = 34;

function createAvatarIcon(photoUrl: string | undefined, displayName: string) {
  const resolvedPhoto = resolveImageUrl(photoUrl);
  const inner = resolvedPhoto
    ? `<img src="${resolvedPhoto}" style="width:100%;height:100%;object-fit:cover;border-radius:9999px;" />`
    : `<div style="width:100%;height:100%;border-radius:9999px;display:flex;align-items:center;justify-content:center;background:${colorFor(
        displayName
      )}33;color:${colorFor(displayName)};font-weight:600;font-size:13px;">${escapeHtml(initialFor(displayName))}</div>`;

  return L.divIcon({
    className: "",
    html: `<div style="width:${SIZE}px;height:${SIZE}px;border-radius:9999px;padding:2px;background:#9a9aa2;box-shadow:0 2px 6px rgba(0,0,0,0.5);">${inner}</div>`,
    iconSize: [SIZE, SIZE],
    iconAnchor: [SIZE / 2, SIZE / 2],
  });
}

// Another opted-in user spotted on the ambient map (not in a race with you) -- same visual
// language as RacerMarker, but a neutral ring since there's no race status to color-code.
// Tapping/clicking the marker opens their full profile (stats + garage); the tooltip stays
// as a lightweight hover hint on desktop. Icon is memoized on photo/name only, same
// jank-avoidance reasoning as RacerMarker.
export function NearbyMarker({ user, onClick }: { user: NearbyUserState; onClick: (userId: string) => void }) {
  const icon = useMemo(
    () => createAvatarIcon(user.carPhotoUrl, user.displayName),
    [user.carPhotoUrl, user.displayName]
  );
  const tooltipHtml = `${escapeHtml(user.displayName)} · ${user.speedKmh.toFixed(1)} km/h`;
  const handleClick = useCallback(() => onClick(user.userId), [onClick, user.userId]);

  return (
    <AnimatedMarker
      position={{ lat: user.lat, lng: user.lng }}
      icon={icon}
      tooltipHtml={tooltipHtml}
      tooltipOffset={[0, -SIZE / 2]}
      onClick={handleClick}
    />
  );
}
