import "leaflet/dist/leaflet.css";
import "./leafletIconFix";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
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

export function LeafletMap({ center, zoom = 14, children, onClick, height = "400px" }: LeafletMapProps) {
  return (
    <div style={{ height, width: "100%" }}>
      <MapContainer center={[center.lat, center.lng]} zoom={zoom} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onClick && <ClickHandler onClick={onClick} />}
        {children}
      </MapContainer>
    </div>
  );
}
