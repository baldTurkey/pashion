import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function InventoryMyListingsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <Card className="p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-ink/60">My Listings</p>
        <h1 className="mt-2 font-serif text-3xl text-brand-ink">View My Listings</h1>
        <p className="mt-3 text-sm text-brand-ink/70">
          This page is ready for your personal listing overview.
        </p>

        <Link
          href="/inventory"
          className="mt-6 inline-flex rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-olive-dark"
        >
          Back to Inventory
        </Link>
      </Card>
    </div>
  );
}
