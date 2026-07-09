import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl bg-white/70 border border-brand-ink/10 shadow-sm ${className}`}
      {...props}
    />
  );
}
