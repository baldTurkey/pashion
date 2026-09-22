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
      <section className="mx-auto w-full max-w-7xl px-6 py-8">{children}</section>
    </main>
  );
}
