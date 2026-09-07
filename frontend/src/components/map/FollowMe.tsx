import { useEffect, useRef, useState } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import type { LatLng } from "../../types/race";

type FollowMeProps = {
  position: LatLng;
  /** Bump this (e.g. increment a counter) to resume following and snap back to `position`. */
  recenterSignal: number;
  onFollowingChange?: (following: boolean) => void;
};

// Keeps the map centered on a live position as it updates, like the "you are here"
// auto-follow in Waze/Google Maps. MapContainer's `center` prop is only honored on
// initial mount -- react-leaflet never re-reads it -- so without this the view stays
// wherever it happened to be when the page first rendered while the position marker
// quietly drifts toward (and past) the edge of the screen.
//
// Manually dragging the map pauses following, so the user isn't fighting an auto-recenter
// while trying to look around; `onFollowingChange` lets the page surface a "recenter"
// button, which resumes following by bumping `recenterSignal`.
export function FollowMe({ position, recenterSignal, onFollowingChange }: FollowMeProps) {
  const map = useMap();
  const [following, setFollowing] = useState(true);
  const hasCenteredOnce = useRef(false);
  const prevRecenterSignal = useRef(recenterSignal);

  useMapEvents({
    dragstart: () => setFollowing(false),
  });

  useEffect(() => {
    onFollowingChange?.(following);
  }, [following, onFollowingChange]);

  useEffect(() => {
    if (prevRecenterSignal.current === recenterSignal) return;
    prevRecenterSignal.current = recenterSignal;
    setFollowing(true);
    map.panTo([position.lat, position.lng], { animate: true, duration: 0.4 });
    // Only react to the signal changing -- re-running this on every position tick would
    // defeat the "user paused following by dragging" behavior above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterSignal]);

  useEffect(() => {
    if (!hasCenteredOnce.current) {
      map.setView([position.lat, position.lng], map.getZoom(), { animate: false });
      hasCenteredOnce.current = true;
      return;
    }
    if (following) map.panTo([position.lat, position.lng], { animate: true, duration: 0.4 });
  }, [position.lat, position.lng, following, map]);

  return null;
}
