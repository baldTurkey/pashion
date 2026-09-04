"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddToCartButton({ productId, className }: { productId: string; className?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "adding" | "added" | "error">("idle");

  const handleClick = async () => {
    setStatus("adding");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        setStatus("error");
        return;
      }

      setStatus("added");
      router.refresh();
    } catch {
      setStatus("error");
    }
  };

  return (
    <button type="button" onClick={handleClick} disabled={status === "adding"} className={className}>
      {status === "adding" ? "Adding…" : status === "added" ? "Added ✓" : status === "error" ? "Try again" : "Add to cart"}
    </button>
  );
}
