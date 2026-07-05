export function SpeedHud({ speedKmh, elapsedMs }: { speedKmh: number; elapsedMs: number }) {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="glass safe-bottom fixed inset-x-4 bottom-4 z-30 flex items-center justify-between rounded-card px-6 py-4">
      <div className="flex flex-col">
        <span className="font-mono text-3xl font-bold text-accent">{speedKmh.toFixed(1)}</span>
        <span className="text-[11px] uppercase tracking-wide text-text-muted">km/h</span>
      </div>
      <div className="h-8 w-px bg-white/10" />
      <div className="flex flex-col items-end">
        <span className="font-mono text-3xl font-bold text-text">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
        <span className="text-[11px] uppercase tracking-wide text-text-muted">elapsed</span>
      </div>
    </div>
  );
}
