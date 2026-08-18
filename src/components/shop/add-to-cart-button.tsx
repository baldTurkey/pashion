"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AddToCartButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "adding" | "added" | "error">("idle");

  const handleClick = async () => {
    setStatus("adding");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, quantity: 1 }),
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
    <Button onClick={handleClick} disabled={status === "adding"} size="sm" className="w-full">
      {status === "adding" ? "Adding…" : status === "added" ? "Added ✓" : status === "error" ? "Try again" : "Add to Cart"}
    </Button>
  );
}
