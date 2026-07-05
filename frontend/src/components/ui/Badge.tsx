import { type ReactNode } from "react";
import clsx from "clsx";

type BadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "accent" | "danger" | "success";
};

const TONE_CLASSES: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "bg-white/8 text-text-muted",
  accent: "bg-accent/15 text-accent",
  danger: "bg-danger/15 text-danger",
  success: "bg-emerald-400/15 text-emerald-400",
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center h-6 px-2.5 rounded-button text-[12px] font-medium tracking-wide",
        TONE_CLASSES[tone]
      )}
    >
      {children}
    </span>
  );
}
