import Link from "next/link";
import { Card } from "@/components/ui/card";

// Shared placeholder for dashboard actions that don't have a real feature
// behind them yet (listings/shows tables don't exist — that's the
// "Marketplace" milestone, deliberately out of scope for this pass).
export function ComingSoon({
  title,
  description,
  backHref,
  backLabel,
}: {
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <Card className="p-8">
        <h1 className="font-serif text-2xl text-brand-ink">{title}</h1>
        <p className="mt-2 text-brand-ink/70">{description}</p>
        <Link
          href={backHref}
          className="mt-6 inline-flex rounded-full bg-brand-accent px-6 py-2.5 text-white hover:bg-brand-olive-dark"
        >
          {backLabel}
        </Link>
      </Card>
    </div>
  );
}
