import { type HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

const variants: Record<string, string> = {
  default: "bg-indigo-500/20 text-indigo-300",
  secondary: "bg-white/10 text-white/80",
  destructive: "bg-red-500/20 text-red-300",
  outline: "border border-white/20 text-white/70",
};

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors ${variants[variant]} ${className ?? ""}`}
      {...props}
    />
  );
}

export { Badge };
