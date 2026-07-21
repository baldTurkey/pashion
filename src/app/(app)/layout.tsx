import type { ReactNode } from "react";
import { NavBar } from "@/components/layout/nav-bar";
import { Footer } from "@/components/layout/footer";

// Wraps every page under (app) the dashboard, the /brands directory, and
// the /brands/[slug] profile page all render inside this shell automatically,
// just by living in this folder.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}