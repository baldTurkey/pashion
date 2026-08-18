import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/layout/logout-button";

const NAV_LINKS = [
  { href: "/brands", label: "Designers" },
  { href: "/shows", label: "Fashion Shows" },
];


export async function NavBar() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

        <Link href="/" className="font-serif text-lg font-semibold text-brand-olive-dark">
          Pashion
        </Link>

        <div className="flex items-center gap-3 sm:gap-6">
          {user ? (
            <>
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
