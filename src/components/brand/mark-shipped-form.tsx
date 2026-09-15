"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MarkShippedForm({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${itemId}/fulfill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNumber }),
      });
      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(result.error || "Failed to mark as shipped");
        return;
      }

      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={trackingNumber}
        onChange={(e) => setTrackingNumber(e.target.value)}
        placeholder="Tracking number (optional)"
        className="rounded-lg border border-brand-ink/15 px-2 py-1 text-xs"
      />
      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-brand-accent px-3 py-1 text-xs font-semibold text-white hover:bg-brand-olive-dark disabled:opacity-60"
      >
        {saving ? "Saving…" : "Mark shipped"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}
