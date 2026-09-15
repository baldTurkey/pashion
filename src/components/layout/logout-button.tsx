"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await supabaseBrowser.auth.signOut();
    // Full reload, not router.push+refresh: the client Router Cache can keep
    // serving a previously-fetched, still-signed-in NavBar for other routes
    // (e.g. after clicking the logo) since refresh() only invalidates the
    // current route. A hard navigation wipes that cache everywhere.
    window.location.href = "/";
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
