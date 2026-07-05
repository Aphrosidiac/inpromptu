import { useMemo } from "react";
import L from "leaflet";
import { Marker } from "react-leaflet";

function createChevronIcon(bearingDeg: number) {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:44px;height:44px;border-radius:9999px;background:radial-gradient(circle, rgba(198,255,77,0.45) 0%, rgba(198,255,77,0) 70%);"></div>
        <svg width="26" height="26" viewBox="0 0 24 24" style="transform:rotate(${bearingDeg}deg);filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
          <path d="M12 2 L20 20 L12 15 L4 20 Z" fill="#c6ff4d" stroke="#08090b" stroke-width="1.5" stroke-linejoin="round" />
        </svg>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

// The current user's own live position marker: a directional chevron that rotates to face
// their heading, matching Waze's "you" car icon -- other racers get the small avatar-circle
// RacerMarker instead.
export function MeMarker({ lat, lng, heading }: { lat: number; lng: number; heading: number }) {
  const icon = useMemo(() => createChevronIcon(heading), [heading]);
  return <Marker position={[lat, lng]} icon={icon} zIndexOffset={1000} />;
}
