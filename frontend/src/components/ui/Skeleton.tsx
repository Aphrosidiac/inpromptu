import clsx from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-input bg-white/[0.06]", className)} />;
}

export function RaceCardSkeleton() {
  return (
    <div className="glass rounded-card p-4 flex items-center justify-between">
      <div className="flex flex-col gap-2 flex-1">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-9 w-24" />
    </div>
  );
}
