import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Covers every /brand/dashboard, /designer/dashboard, and /account route
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Card className="p-8">
        <div className="mb-8 flex items-center gap-4">
          <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-7 w-56" />
          </div>
        </div>

        <Skeleton className="mb-6 h-16 w-full rounded-2xl" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      </Card>
    </div>
  );
}
