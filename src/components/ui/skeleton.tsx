import type { HTMLAttributes } from "react";

//  a shape that roughly matches the real layout reads as "almost
// there" instead of "something is loading," which is the whole point.
export function Skeleton({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`animate-pulse rounded-lg bg-brand-ink/10 ${className}`} {...props} />;
}
