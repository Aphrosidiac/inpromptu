import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "motion/react";
import { LeaderboardTable } from "./LeaderboardTable";
import { racersToLiveResults } from "../../lib/liveResults";
import type { RacerLiveState } from "../../types/race";

export function LiveRaceSheet({
  raceId,
  racers,
  currentUserId,
  speedKmh,
  elapsedMs,
}: {
  raceId: string;
  racers: RacerLiveState[];
  currentUserId?: string;
  speedKmh: number;
  elapsedMs: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();
  const results = racersToLiveResults(racers, raceId);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y < -24) setExpanded(true);
    else if (info.offset.y > 24) setExpanded(false);
  }

  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <motion.div
      layout
      className="glass safe-bottom fixed inset-x-4 bottom-4 z-30 overflow-hidden rounded-card"
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 340, damping: 32 }}
    >
      <motion.div
        className="flex cursor-grab flex-col items-center pt-2.5 pb-1 active:cursor-grabbing"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.5}
        onDragEnd={handleDragEnd}
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="h-1.5 w-10 rounded-full bg-white/15" />
      </motion.div>

      <div className="flex items-center justify-between px-6 pb-4 pt-1">
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

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : 0.12 } }}
            className="max-h-[45vh] overflow-y-auto px-4 pb-4"
          >
            <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-text-muted">Live standings</p>
            <LeaderboardTable results={results} currentUserId={currentUserId} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
