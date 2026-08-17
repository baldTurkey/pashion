"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";

export type DraftListing = {
  id: number;
  name: string | null;
  imageUrl: string | null;
  currentPrice: string | null;
  description: string | null;
  type: string | null;
};

export function DraftListings({ initialDrafts }: { initialDrafts: DraftListing[] }) {
  const [drafts, setDrafts] = useState(initialDrafts);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const publishDraft = async (id: number) => {
    setPublishingId(id);
    setError(null);

    const supabase = createClient();
    const { error: publishError } = await supabase
      .from("products")
      .update({ listing_status: "published" })
      .eq("id", id)
      .eq("listing_status", "draft");

    if (publishError) {
      setError(publishError.message);
      setPublishingId(null);
      return;
    }

    setDrafts((current) => current.filter((draft) => draft.id !== id));
    setPublishingId(null);
  };

  if (drafts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <h2 className="font-serif text-2xl text-brand-ink">No drafts waiting</h2>
        <p className="mt-2 text-sm text-brand-ink/70">
          Inventory scheduled to sell will appear here on its ready-to-sell date for your approval.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Could not publish draft: {error}</p>}
      {drafts.map((draft) => (
        <Card key={draft.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-brand-blush">
              {draft.imageUrl ? <img src={draft.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-serif text-xl text-brand-ink">{draft.name || "Untitled item"}</h2>
              <p className="mt-1 text-sm text-brand-ink/70">{draft.type || "Product"} {draft.currentPrice ? `· $${draft.currentPrice}` : ""}</p>
              {draft.description && <p className="mt-1 line-clamp-2 text-sm text-brand-ink/60">{draft.description}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => publishDraft(draft.id)}
            disabled={publishingId === draft.id}
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-olive-dark disabled:cursor-wait disabled:opacity-70"
          >
            {publishingId === draft.id ? "Publishing..." : "Approve & publish"}
          </button>
        </Card>
      ))}
    </div>
  );
}