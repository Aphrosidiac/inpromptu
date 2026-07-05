import { type ReactNode } from "react";

export function StatCard({ icon, label, value, unit }: { icon: ReactNode; label: string; value: string; unit?: string }) {
  return (
    <div className="glass flex flex-col gap-2 rounded-card p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent">{icon}</div>
      <div>
        <span className="font-mono text-xl font-semibold text-text">{value}</span>
        {unit && <span className="ml-1 text-[12px] text-text-muted">{unit}</span>}
      </div>
      <span className="text-[12px] text-text-muted">{label}</span>
    </div>
  );
}
