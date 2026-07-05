import { Medal } from "@phosphor-icons/react";
import { Avatar } from "../ui/Avatar";
import type { RaceResult } from "../../types/race";

const MEDAL_COLOR: Record<number, string> = {
  1: "#ffd54d",
  2: "#c7cdd6",
  3: "#d8894f",
};

function formatElapsed(ms: number | null) {
  if (ms == null) return "-";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function LeaderboardTable({ results, currentUserId }: { results: RaceResult[]; currentUserId?: string }) {
  return (
    <div className="flex flex-col gap-2">
      {results.map((r) => {
        const isMe = r.userId === currentUserId;
        const medal = r.rank ? MEDAL_COLOR[r.rank] : undefined;
        return (
          <div
            key={r.id}
            className={`glass flex items-center gap-3 rounded-card p-3.5 ${isMe ? "border-accent/40" : ""}`}
          >
            <div className="flex w-7 items-center justify-center">
              {medal ? (
                <Medal size={22} weight="fill" style={{ color: medal }} />
              ) : (
                <span className="font-mono text-[13px] text-text-muted">{r.didNotFinish ? "DNF" : r.rank ?? "-"}</span>
              )}
            </div>
            <Avatar name={r.participant.user.displayName} size={32} />
            <div className="flex flex-1 flex-col">
              <span className="text-[14px] font-medium text-text">
                {r.participant.user.displayName}
                {isMe && <span className="ml-1.5 text-[11px] text-accent">(you)</span>}
              </span>
              {r.averageSpeedKmh && (
                <span className="text-[12px] text-text-muted">{r.averageSpeedKmh.toFixed(1)} km/h avg</span>
              )}
            </div>
            <span className="font-mono text-[15px] font-semibold text-text">{formatElapsed(r.elapsedMs)}</span>
          </div>
        );
      })}
    </div>
  );
}
