import { type InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, id, ...props },
  ref
) {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-medium text-text-muted">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={clsx(
          "h-12 rounded-input bg-white/5 border border-border px-4 text-[16px] text-text",
          "placeholder:text-text-muted/70 outline-none transition-colors",
          "focus:border-accent/60 focus:bg-white/[0.07]",
          error && "border-danger/50",
          className
        )}
        {...props}
      />
      {error && <span className="text-[13px] text-danger">{error}</span>}
    </div>
  );
});
