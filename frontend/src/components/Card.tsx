import type { HTMLAttributes } from "react";

export type CardSurface = "card" | "raised" | "sunken";
export type CardPad = "sm" | "md" | "lg";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  surface?: CardSurface;
  pad?: CardPad;
}

export function Card({ surface = "card", pad = "md", className = "", ...props }: CardProps) {
  const surfaceClass = surface === "card" ? "" : `k-card-${surface}`;
  const classes = ["k-card", surfaceClass, `k-card-pad-${pad}`, className].filter(Boolean).join(" ");
  return <div className={classes} {...props} />;
}
