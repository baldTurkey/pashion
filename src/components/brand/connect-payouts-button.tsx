"use client";

import { useState } from "react";

export function ConnectPayoutsButton({ label = "Connect Payouts" }: { label?: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url; // send them to Stripe's hosted onboarding
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center justify-center rounded-full bg-brand-accent px-6 py-3 text-sm font-semibold text-white hover:bg-brand-olive-dark disabled:opacity-60"
    >
      {loading ? "Redirecting…" : label}
    </button>
  );
}
