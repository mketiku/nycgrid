import { type ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  "inline-flex items-center justify-center gap-2 font-mono text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)] disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--color-accent)] text-[var(--color-on-accent)] hover:opacity-90 active:opacity-80",
  secondary:
    "border border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
  ghost: "bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
};

const sizes: Record<Size, string> = {
  sm: "h-7 px-3 text-xs",
  md: "h-9 px-4",
  lg: "h-11 px-6 text-base",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  return twMerge(clsx(base, variants[variant], sizes[size], className));
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => (
    <button ref={ref} className={buttonClasses({ variant, size, className })} {...props}>
      {children}
    </button>
  )
);

Button.displayName = "Button";
