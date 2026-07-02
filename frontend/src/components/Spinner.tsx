interface SpinnerProps {
  size?: "sm" | "md";
  className?: string;
}

export function Spinner({ size = "sm", className = "" }: SpinnerProps) {
  return <span className={["k-spinner", `k-spinner-${size}`, className].filter(Boolean).join(" ")} role="status" aria-label="Loading" />;
}
