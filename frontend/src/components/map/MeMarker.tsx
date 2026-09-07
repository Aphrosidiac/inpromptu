import L from "leaflet";
import { AnimatedMarker } from "./AnimatedMarker";

function createChevronIcon() {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:44px;height:44px;border-radius:9999px;background:radial-gradient(circle, rgba(198,255,77,0.45) 0%, rgba(198,255,77,0) 70%);"></div>
        <svg data-rotate width="26" height="26" viewBox="0 0 24 24" style="transition:transform 0.3s ease-out;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
          <path d="M12 2 L20 20 L12 15 L4 20 Z" fill="#c6ff4d" stroke="#08090b" stroke-width="1.5" stroke-linejoin="round" />
        </svg>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

// The icon's HTML never depends on heading -- only one is ever needed, built once at
// module load. Rotation is applied afterwards via direct style manipulation (see
// AnimatedMarker's rotationDeg handling) so the CSS transition above can actually ease
// between angles instead of every heading tick tearing down and rebuilding the icon's DOM.
const ICON = createChevronIcon();

// The current user's own live position marker: a directional chevron that rotates to face
// their heading, matching Waze's "you" car icon -- other racers get the small avatar-circle
// RacerMarker instead.
export function MeMarker({ lat, lng, heading }: { lat: number; lng: number; heading: number }) {
  return <AnimatedMarker position={{ lat, lng }} icon={ICON} zIndexOffset={1000} rotationDeg={heading} />;
}
