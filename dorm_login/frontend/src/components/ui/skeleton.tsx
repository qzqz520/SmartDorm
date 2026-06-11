import { type HTMLAttributes } from "react";

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-white/10 ${className ?? ""}`}
      {...props}
    />
  );
}

export { Skeleton };
