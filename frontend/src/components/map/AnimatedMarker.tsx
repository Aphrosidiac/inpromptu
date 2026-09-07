import { useEffect, useRef } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";

type LatLngLiteral = { lat: number; lng: number };

type AnimatedMarkerProps = {
  position: LatLngLiteral;
  icon: L.DivIcon;
  zIndexOffset?: number;
  tooltipHtml?: string;
  tooltipOffset?: [number, number];
  onClick?: () => void;
  /** Degrees applied as a CSS rotation to the icon's `[data-rotate]` element, if any. */
  rotationDeg?: number;
};

const GLIDE_MS = 350;

// react-leaflet's declarative <Marker> just calls setLatLng on every position-prop change --
// an instant hop between GPS fixes that reads as jittery once samples arrive every ~500ms.
// This drives a plain Leaflet marker imperatively instead, easing from the last rendered
// position to the next one over GLIDE_MS so movement reads as a glide rather than a series
// of jumps (the same technique behind react-leaflet-tracking-marker / Leaflet.AnimatedMarker).
export function AnimatedMarker({
  position,
  icon,
  zIndexOffset,
  tooltipHtml,
  tooltipOffset,
  onClick,
  rotationDeg,
}: AnimatedMarkerProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    const marker = L.marker([position.lat, position.lng], { icon, zIndexOffset }).addTo(map);
    markerRef.current = marker;
    return () => {
      marker.remove();
      markerRef.current = null;
    };
    // Position/icon/tooltip updates are applied imperatively in the effects below rather
    // than by remounting the marker -- only a change of map instance should recreate it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || !onClick) return;
    marker.on("click", onClick);
    return () => {
      marker.off("click", onClick);
    };
  }, [onClick]);

  useEffect(() => {
    markerRef.current?.setIcon(icon);
  }, [icon]);

  // Rotating via direct style manipulation (rather than baking the angle into the icon's
  // HTML and recreating it on every heading tick) lets a plain CSS transition on the
  // element ease between angles smoothly, with no DOM node replacement.
  useEffect(() => {
    if (rotationDeg == null) return;
    const el = markerRef.current?.getElement()?.querySelector<HTMLElement>("[data-rotate]");
    if (el) el.style.transform = `rotate(${rotationDeg}deg)`;
  }, [rotationDeg, icon]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    if (tooltipHtml == null) {
      marker.unbindTooltip();
      return;
    }
    if (marker.getTooltip()) marker.setTooltipContent(tooltipHtml);
    else marker.bindTooltip(tooltipHtml, { direction: "top", offset: tooltipOffset ?? [0, 0] });
  }, [tooltipHtml, tooltipOffset]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    const from = marker.getLatLng();
    const to = position;
    const start = performance.now();
    let frame: number;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / GLIDE_MS);
      const eased = 1 - (1 - t) * (1 - t); // ease-out
      marker.setLatLng([from.lat + (to.lat - from.lat) * eased, from.lng + (to.lng - from.lng) * eased]);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [position.lat, position.lng]);

  return null;
}
