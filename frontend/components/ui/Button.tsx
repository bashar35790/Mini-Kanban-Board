import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-primary to-primary-hover text-white hover:brightness-110 focus-visible:ring-primary/50",
  secondary:
    "bg-surface-2 text-text border border-border hover:bg-surface",
  ghost: "bg-transparent text-muted hover:text-text hover:bg-surface-2",
  danger: "bg-danger/90 text-white hover:bg-danger",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
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
        className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className ?? ""}`}
        {...props}
      >
        {loading ? <Spinner className="h-4 w-4" /> : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
