import type { ReactNode } from "react";
import Link from "next/link";
import { Shirt } from "lucide-react";

// Deliberately does NOT render NavBar/Footer — sign-up/login pages should
// just be the form, full-bleed, not the general site chrome. This is a
// sibling of (app), not nested inside it, specifically so it doesn't inherit
// (app)/layout.tsx's nav/footer.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-10">
      <Link
        href="/"
        className="flex items-center gap-2 font-serif text-2xl font-semibold text-brand-olive-dark"
      >
        <Shirt size={24} />
        Pashion
      </Link>
      {children}
    </div>
  );
}
