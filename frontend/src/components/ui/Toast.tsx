import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckCircle, Info, WarningCircle, FlagCheckered } from "@phosphor-icons/react";
import clsx from "clsx";

type ToastTone = "info" | "success" | "warning" | "finish";

type ToastItem = { id: number; message: string; tone: ToastTone };

type ToastContextValue = {
  show: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_ICON: Record<ToastTone, ReactNode> = {
  info: <Info size={20} weight="fill" />,
  success: <CheckCircle size={20} weight="fill" />,
  warning: <WarningCircle size={20} weight="fill" />,
  finish: <FlagCheckered size={20} weight="fill" />,
};

const TONE_COLOR: Record<ToastTone, string> = {
  info: "text-text",
  success: "text-emerald-400",
  warning: "text-amber-400",
  finish: "text-accent",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const reduceMotion = useReducedMotion();

  const show = useCallback((message: string, tone: ToastTone = "info") => {
    const id = idRef.current++;
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {createPortal(
        <div className="safe-top pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-3">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -16, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: reduceMotion ? 0 : 0.15 } }}
                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 32 }}
                className="glass pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-button px-4 py-3 text-[14px] text-text shadow-lg"
              >
                <span className={clsx("shrink-0", TONE_COLOR[t.tone])}>{TONE_ICON[t.tone]}</span>
                {t.message}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
