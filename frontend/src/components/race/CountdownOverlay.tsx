import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

// Renders the countdown purely from the server-broadcast `raceStartAt` timestamp -- never
// from a locally-started timer -- so all racers see GO at the same wall-clock instant
// regardless of individual clock drift.
export function CountdownOverlay({ raceStartAt }: { raceStartAt: number }) {
  const [secondsLeft, setSecondsLeft] = useState(() => Math.ceil((raceStartAt - Date.now()) / 1000));
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(Math.ceil((raceStartAt - Date.now()) / 1000));
    }, 100);
    return () => clearInterval(interval);
  }, [raceStartAt]);

  const isGo = secondsLeft <= 0;

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          key={secondsLeft}
          className="font-mono text-[120px] font-bold leading-none"
          style={{ color: isGo ? "var(--color-accent)" : "var(--color-text)" }}
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.55 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: reduceMotion ? 1 : 1.25 }}
          transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 26 }}
        >
          {isGo ? "GO" : secondsLeft}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
