import type { InputHTMLAttributes } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  inputSize?: "md" | "lg";
}

export function Input({ inputSize = "md", className = "", ...props }: InputProps) {
  const classes = ["k-input", inputSize === "lg" ? "k-input-lg" : "", className].filter(Boolean).join(" ");
  return <input className={classes} {...props} />;
}
