"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shirt, UserCircle, LogOut } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";

// Separate from the public NavBar on purpose — a logged-in brand/designer
// shouldn't see "Sign Up / Log In" on their own dashboard. This one shows
// account management + sign out instead.
export function DashboardNavBar() {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabaseBrowser.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-10 flex justify-center px-4 py-4">
      <nav className="flex w-full max-w-4xl items-center justify-between gap-4 rounded-full bg-white/90 px-6 py-3 shadow-sm backdrop-blur">
        <Link href="/" className="flex items-center gap-2 font-serif text-lg font-semibold text-brand-olive-dark">
          <Shirt size={20} />
          Pashion
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/account"
            className="flex items-center gap-1.5 text-sm font-medium text-brand-ink hover:text-brand-accent"
          >
            <UserCircle size={16} />
            Manage Account
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-ink hover:text-brand-accent"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </nav>
    </header>
  );
}
