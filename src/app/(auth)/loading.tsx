import { Skeleton } from "@/components/ui/skeleton";

// Shown instantly by Next.js while an (auth) route's real content streams in

export default function AuthLoading() {
  return (
    <div className="w-full max-w-md rounded-3xl border border-brand-ink/10 bg-white/70 p-8 shadow-sm">
      <Skeleton className="mx-auto h-7 w-40" />
      <Skeleton className="mx-auto mt-3 h-4 w-56" />

      <div className="mt-8 space-y-5">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>

      <Skeleton className="mt-8 h-11 w-full rounded-full" />
    </div>
  );
}
