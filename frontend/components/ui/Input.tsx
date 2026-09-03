import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, leftIcon, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            {label}
          </label>
        ) : null}
        <div className="relative flex items-center w-full">
          {leftIcon ? (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            className={`h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-xs transition-all duration-150 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-3 focus:ring-indigo-100 ${
              leftIcon ? "pl-9" : ""
            } ${error ? "border-rose-400 focus:border-rose-400 focus:ring-rose-100" : ""} ${className ?? ""}`}
            {...props}
          />
        </div>
        {error ? (
          <span className="text-xs text-rose-500 font-medium">{error}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
