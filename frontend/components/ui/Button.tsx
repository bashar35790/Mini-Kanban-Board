import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "pill";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-[#6366f1] text-white hover:bg-[#4f46e5] shadow-sm shadow-indigo-200 active:scale-[0.98]",
  secondary:
    "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-xs",
  ghost: "bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60",
  danger: "bg-rose-500 text-white hover:bg-rose-600 shadow-sm shadow-rose-100",
  pill: "bg-blue-600 text-white hover:bg-blue-700 rounded-full font-medium shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs font-medium rounded-lg",
  md: "h-10 px-4 text-sm font-medium rounded-xl",
  lg: "h-11 px-5 text-base font-medium rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, disabled, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${variants[variant]} ${sizes[size]} ${className ?? ""}`}
        {...props}
      >
        {loading ? <Spinner className="h-4 w-4" /> : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
