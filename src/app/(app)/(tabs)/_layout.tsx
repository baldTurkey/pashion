import Link from "next/link";
import { ReactNode } from "react";

type TabsLayoutProps = {
  children: ReactNode;
};

const navItems = [
  { href: "/home", label: "Home" },
  { href: "/profile", label: "Profile" },
  { href: "/cart", label: "Cart" },
];

export default function TabLayout({ children }: TabsLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/home" className="text-xl font-semibold tracking-tight">
            Pashion
          </Link>
          <nav className="flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <section className="mx-auto w-full max-w-7xl px-6 py-8">{children}</section>
    </main>
  );
}
