import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "accent" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-navy text-white hover:bg-navy-light",
  accent: "bg-red text-white hover:bg-red-light",
  outline: "border border-navy text-navy hover:bg-navy hover:text-white",
  ghost: "text-navy hover:bg-navy/5",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-2.5 text-sm",
  lg: "px-8 py-3.5 text-base",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

function classesFor(variant: Variant, size: Size, className: string): string {
  return `${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`;
}

type LinkButtonProps = {
  href: string;
  target?: string;
  rel?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function LinkButton({
  href,
  target,
  rel,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: LinkButtonProps) {
  return (
    <Link href={href} target={target} rel={rel} className={classesFor(variant, size, className)}>
      {children}
    </Link>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({ variant = "primary", size = "md", className = "", children, ...rest }: ButtonProps) {
  return (
    <button {...rest} className={classesFor(variant, size, className)}>
      {children}
    </button>
  );
}
