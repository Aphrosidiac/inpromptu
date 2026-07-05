import { type ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-14 px-6">
      <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-text-muted">
        {icon}
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[15px] font-medium text-text">{title}</p>
        {description && <p className="text-[13px] text-text-muted max-w-[28ch]">{description}</p>}
      </div>
      {action}
    </div>
  );
}
