import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "lg" | "xl";

export function buttonClassName(variant: ButtonVariant = "primary", size: ButtonSize = "md", block = false, extra = "") {
  return ["k-btn", `k-btn-${variant}`, `k-btn-${size}`, block ? "k-btn-block" : "", extra].filter(Boolean).join(" ");
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
}

export function Button({ variant = "primary", size = "md", block = false, className = "", ...props }: ButtonProps) {
  return <button className={buttonClassName(variant, size, block, className)} {...props} />;
}
