import "leaflet/dist/leaflet.css";
import "./leafletIconFix";
import { useEffect } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { ReactNode } from "react";
import type { LatLng } from "../../types/race";

type LeafletMapProps = {
  center: LatLng;
  zoom?: number;
  children?: ReactNode;
  onClick?: (latlng: LatLng) => void;
  height?: string;
};

function ClickHandler({ onClick }: { onClick?: (latlng: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Leaflet caches the container's pixel size at init and only recomputes it on a window
// "resize" event. Anything else that changes the container's actual rendered size -- a
// mobile browser's address bar collapsing on scroll (these maps use 100dvh), a page
// transition animation still settling when the map mounts, a bottom sheet toggling over
// the map -- leaves that cache stale. Every layer (route line, markers) is projected from
// that stale size, so they visibly drift away from the tiles as soon as you zoom. Watching
// the container with a ResizeObserver keeps the cache honest.
function SizeInvalidator() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);

    // Catch the case where the container's final size only settles a frame or two after
    // this mounts (e.g. mid page-transition animation).
    const raf = requestAnimationFrame(() => map.invalidateSize());

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [map]);
  return null;
}

export function LeafletMap({ center, zoom = 14, children, onClick, height = "400px" }: LeafletMapProps) {
  return (
    <div style={{ height, width: "100%" }}>
      <MapContainer center={[center.lat, center.lng]} zoom={zoom} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />
        <SizeInvalidator />
        {onClick && <ClickHandler onClick={onClick} />}
        {children}
      </MapContainer>
    </div>
  );
}
