import Link from "next/link";

const NAV_LINKS = [
  { href: "/brands", label: "Designers" },
  { href: "/", label: "Fashion Show" },
];

export function NavBar() {
  return (
    <header className="sticky top-0 z-10 flex justify-center px-4 py-4">
      <nav className="flex w-full max-w-4xl items-center justify-between gap-4 rounded-full bg-white/90 px-6 py-3 shadow-sm backdrop-blur">
        <div className="flex items-center gap-6">
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

        <div className="flex items-center gap-6">
          <Link href="/sign-up" className="text-sm font-medium text-brand-ink hover:text-brand-accent">
            Sign Up / Log In
          </Link>
          <Link href="/" className="text-sm font-medium text-brand-ink hover:text-brand-accent">
            Contact
          </Link>
          <Link href="/" className="text-sm font-medium text-brand-ink hover:text-brand-accent">
            About
          </Link>
        </div>
      </nav>
    </header>
  );
}
