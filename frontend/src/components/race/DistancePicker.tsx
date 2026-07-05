type DistancePickerProps = {
  distanceMeters: number;
  onChange: (meters: number) => void;
};

export function DistancePicker({ distanceMeters, onChange }: DistancePickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-text-muted">Distance</span>
        <span className="font-mono text-2xl font-semibold text-accent">
          {(distanceMeters / 1000).toFixed(1)}
          <span className="ml-1 text-sm text-text-muted">km</span>
        </span>
      </div>
      <input
        type="range"
        min={1000}
        max={10000}
        step={500}
        value={distanceMeters}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-accent"
        aria-label="Distance in kilometers"
      />
      <div className="flex justify-between text-[11px] text-text-muted">
        <span>1 km</span>
        <span>10 km</span>
      </div>
    </div>
  );
}
