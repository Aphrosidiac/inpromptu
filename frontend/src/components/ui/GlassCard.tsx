import { type HTMLAttributes } from "react";
import clsx from "clsx";

export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("glass rounded-card p-5", className)} {...props} />;
}
