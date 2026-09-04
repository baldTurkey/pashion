import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/layout/logout-button";

const NAV_LINKS = [
  { href: "/home", label: "Shop" },
  { href: "/brands", label: "Designers" },
  { href: "/shows", label: "Fashion Shows" },
];

// Matches the `role` value each signup form stores in auth user_metadata
// (see login-form.tsx's DASHBOARD_BY_ROLE) — used so the center logo takes
// brand/designer users straight to their dashboard instead of the
// customer-facing homepage.
const DASHBOARD_BY_ROLE: Record<string, string> = {
  Brand: "/brand/dashboard",
  Designer: "/designer/dashboard",
};

export async function NavBar() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role as string | undefined;
  const dashboardHref = role ? DASHBOARD_BY_ROLE[role] : undefined;

  return (
    <header className="sticky top-0 z-10 flex justify-center px-2 py-4 sm:px-4">
      <nav className="flex w-full max-w-4xl items-center justify-between gap-0 rounded-full bg-white/90 px-3 py-3 shadow-sm backdrop-blur sm:gap-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-brand-ink hover:text-brand-accent"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {dashboardHref ? (
          <Link href={dashboardHref} className="font-serif text-lg font-semibold text-brand-olive-dark">
            Dashboard
          </Link>
        ) : (
          <Link href="/" className="font-serif text-lg font-semibold text-brand-olive-dark">
            Pashion
          </Link>
        )}

        <div className="flex items-center gap-3 sm:gap-6">
          {user ? (
            <>
              <Link href="/cart" className="text-sm font-medium text-brand-ink hover:text-brand-accent">
                Cart
              </Link>
              <Link href="/account" className="text-sm font-medium text-brand-ink hover:text-brand-accent">
                Account
              </Link>
              <LogoutButton />
            </>
          ) : (
            <Link href="/sign-up" className="text-sm font-medium text-brand-ink hover:text-brand-accent">
              Sign Up / Log In
            </Link>
          )}
          <Link href="/" className="hidden text-sm font-medium text-brand-ink hover:text-brand-accent sm:block">
            Contact
          </Link>
          <Link href="/" className="hidden text-sm font-medium text-brand-ink hover:text-brand-accent sm:block">
            About
          </Link>
        </div>
      </nav>
    </header>
  );
}
