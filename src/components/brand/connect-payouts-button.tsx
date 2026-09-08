"use client";

import { useState } from "react";

export function ConnectPayoutsButton({ label = "Connect Payouts" }: { label?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Unable to connect Stripe payouts");
      }

      if (!data.url) {
        throw new Error("Stripe did not return an onboarding link");
      }

      window.location.href = data.url; // send them to Stripe's hosted onboarding
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to connect Stripe payouts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-full bg-brand-accent px-6 py-3 text-sm font-semibold text-white hover:bg-brand-olive-dark disabled:opacity-60"
      >
        {loading ? "Redirecting…" : label}
      </button>
      {error && <p className="max-w-xs text-right text-sm text-red-700" role="alert">{error}</p>}
    </div>
  );
}
