import { useEffect, useRef } from "react";

// Keeps the screen on while `enabled`. Known v1 limitation: this only helps while the tab
// is foregrounded — it does not prevent mobile browsers from throttling/suspending GPS
// watches if the user actually backgrounds the tab or locks the phone. Full background
// reliability would need a native wrapper (Capacitor), out of scope for v1.
export function useWakeLock(enabled: boolean) {
  const sentinel = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled || !("wakeLock" in navigator)) return;

    async function acquire() {
      try {
        sentinel.current = await navigator.wakeLock.request("screen");
      } catch {
        // wake lock not available (e.g. low battery, unsupported) — silently degrade
      }
    }

    acquire();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") acquire();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      sentinel.current?.release();
      sentinel.current = null;
    };
  }, [enabled]);
}
