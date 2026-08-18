"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await supabaseBrowser.auth.signOut();
    router.push("/");
    router.refresh(); // NavBar is a server component — refresh so it re-checks the now-cleared session
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="text-sm font-medium text-brand-ink hover:text-brand-accent disabled:opacity-60"
    >
      {loading ? "Signing out…" : "Log Out"}
    </button>
  );
}
