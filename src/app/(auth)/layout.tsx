import type { ReactNode } from "react";

// Deliberately does NOT render NavBar/Footer — sign-up/login pages should
// just be the form, full-bleed, not the general site chrome. This is a
// sibling of (app), not nested inside it, specifically so it doesn't inherit
// (app)/layout.tsx's nav/footer.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      {children}
    </div>
  );
}
