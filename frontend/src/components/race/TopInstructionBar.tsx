import { ArrowUp } from "@phosphor-icons/react";

// Waze shows next-turn distance from real road routing; Inpromptu has no routing engine
// (straight-line/waypoint routes only), so the honest equivalent is distance-to-finish plus
// an arrow showing which way to head relative to the racer's current direction of travel.
export function TopInstructionBar({
  distanceMeters,
  relativeBearing,
}: {
  distanceMeters: number;
  relativeBearing: number;
}) {
  const km = distanceMeters / 1000;
  const label = km >= 1 ? `${km.toFixed(1)} km` : `${Math.max(0, Math.round(distanceMeters))} m`;

  return (
    <div className="safe-top fixed inset-x-0 top-0 z-20 flex items-center gap-4 bg-black/85 px-5 pb-4 pt-3 backdrop-blur-sm">
      <ArrowUp
        size={36}
        weight="bold"
        className="shrink-0 text-accent transition-transform duration-300"
        style={{ transform: `rotate(${relativeBearing}deg)` }}
      />
      <div>
        <div className="text-2xl font-bold text-text">{label}</div>
        <div className="text-[13px] text-text-muted">to finish</div>
      </div>
    </div>
  );
}
