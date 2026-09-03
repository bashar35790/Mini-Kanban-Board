import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-muted"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={`h-10 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-text placeholder:text-muted/60 transition-all duration-200 ease-out focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 ${error ? "border-danger focus:border-danger focus:ring-danger/40" : ""} ${className ?? ""}`}
          {...props}
        />
        {error ? (
          <span className="text-xs text-danger">{error}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
