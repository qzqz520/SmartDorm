import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "indigo" | "blue" | "emerald" | "amber" | "rose";
  size?: "sm" | "md" | "lg";
}

const variants = {
  indigo: "from-indigo-500 to-purple-500 shadow-indigo-500/25 hover:shadow-indigo-500/40",
  blue: "from-blue-500 to-cyan-500 shadow-blue-500/25 hover:shadow-blue-500/40",
  emerald: "from-emerald-500 to-teal-500 shadow-emerald-500/25 hover:shadow-emerald-500/40",
  amber: "from-amber-500 to-orange-500 shadow-amber-500/25 hover:shadow-amber-500/40",
  rose: "from-rose-500 to-pink-500 shadow-rose-500/25 hover:shadow-rose-500/40",
};

const sizes = { sm: "px-3 py-1.5 text-xs rounded-lg", md: "px-4 py-2 text-sm rounded-xl", lg: "px-6 py-3 text-sm rounded-xl" };

export function GradientButton({ variant = "indigo", size = "md", className, children, ...props }: Props) {
  return (
    <button className={cn("bg-gradient-to-r text-white font-semibold shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0", variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}
