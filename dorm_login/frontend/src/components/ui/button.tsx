import { forwardRef, type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const variants: Record<string, string> = {
  default: "bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-black/20",
  destructive: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-black/20",
  outline: "border border-white/20 bg-transparent hover:bg-white/10 text-white/80",
  ghost: "hover:bg-white/10 text-white/60",
  link: "text-indigo-500 underline-offset-4 hover:underline",
};

const sizes: Record<string, string> = {
  default: "h-9 px-4 py-2",
  sm: "h-8 rounded-md px-3 text-xs",
  lg: "h-10 rounded-md px-8",
  icon: "h-9 w-9",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer ${variants[variant]} ${sizes[size]} ${className ?? ""}`}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button };
