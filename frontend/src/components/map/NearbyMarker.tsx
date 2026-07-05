import L from "leaflet";
import { Marker, Tooltip } from "react-leaflet";
import { resolveImageUrl } from "../../lib/api";
import { colorFor, initialFor } from "../../lib/avatarColor";
import type { NearbyUserState } from "../../types/race";

const SIZE = 34;

function createAvatarIcon(user: NearbyUserState) {
  const photoUrl = resolveImageUrl(user.carPhotoUrl);
  const inner = photoUrl
    ? `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:9999px;" />`
    : `<div style="width:100%;height:100%;border-radius:9999px;display:flex;align-items:center;justify-content:center;background:${colorFor(
        user.displayName
      )}33;color:${colorFor(user.displayName)};font-weight:600;font-size:13px;">${initialFor(user.displayName)}</div>`;

  return L.divIcon({
    className: "",
    html: `<div style="width:${SIZE}px;height:${SIZE}px;border-radius:9999px;padding:2px;background:#9a9aa2;box-shadow:0 2px 6px rgba(0,0,0,0.5);">${inner}</div>`,
    iconSize: [SIZE, SIZE],
    iconAnchor: [SIZE / 2, SIZE / 2],
  });
}

// Another opted-in user spotted on the ambient map (not in a race with you) -- same visual
// language as RacerMarker, but a neutral ring since there's no race status to color-code.
// Tapping/clicking the marker opens their full profile (stats + garage); the tooltip stays as
// a lightweight hover hint on desktop.
export function NearbyMarker({ user, onClick }: { user: NearbyUserState; onClick: (userId: string) => void }) {
  const icon = createAvatarIcon(user);
  return (
    <Marker position={[user.lat, user.lng]} icon={icon} eventHandlers={{ click: () => onClick(user.userId) }}>
      <Tooltip direction="top" offset={[0, -SIZE / 2]}>
        {user.displayName} · {user.speedKmh.toFixed(1)} km/h
      </Tooltip>
    </Marker>
  );
}
