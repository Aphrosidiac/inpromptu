import { useState } from "react";
import { Marker } from "react-leaflet";
import { LeafletMap } from "./LeafletMap";
import { BottomSheet } from "../ui/BottomSheet";
import { Button } from "../ui/Button";
import type { LatLng } from "../../types/race";

type PinDropModalProps = {
  open: boolean;
  center: LatLng;
  onConfirm: (start: LatLng, end: LatLng) => void;
  onClose: () => void;
};

export function PinDropModal({ open, center, onConfirm, onClose }: PinDropModalProps) {
  const [start, setStart] = useState<LatLng | null>(null);
  const [end, setEnd] = useState<LatLng | null>(null);

  function handleMapClick(latlng: LatLng) {
    if (!start) setStart(latlng);
    else if (!end) setEnd(latlng);
  }

  function reset() {
    setStart(null);
    setEnd(null);
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Drop start & finish pins">
      <p className="mb-3 text-[13px] text-text-muted">
        {!start && "Tap the map to place the start pin."}
        {start && !end && "Now tap to place the finish pin."}
        {start && end && "Both pins placed. Confirm or reset below."}
      </p>
      <div className="overflow-hidden rounded-input">
        <LeafletMap center={center} onClick={handleMapClick} height="320px">
          {start && <Marker position={[start.lat, start.lng]} />}
          {end && <Marker position={[end.lat, end.lng]} />}
        </LeafletMap>
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="glass" onClick={reset} className="flex-1">
          Reset
        </Button>
        <Button disabled={!start || !end} onClick={() => start && end && onConfirm(start, end)} className="flex-1">
          Confirm route
        </Button>
      </div>
    </BottomSheet>
  );
}
