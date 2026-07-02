import type { HTMLAttributes } from "react";

export type BadgeVariant = "brand" | "success" | "warning" | "danger" | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "neutral", className = "", ...props }: BadgeProps) {
  const classes = ["k-badge", `k-badge-${variant}`, className].filter(Boolean).join(" ");
  return <span className={classes} {...props} />;
}
