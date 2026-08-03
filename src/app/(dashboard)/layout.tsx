import type { ReactNode } from "react";
import { DashboardNavBar } from "@/components/layout/dashboard-nav-bar";

// Sibling of (app), not nested inside it — so logged-in dashboard pages get
// DashboardNavBar instead of the public NavBar/Footer. No footer here; a
// marketing footer doesn't belong on an authenticated app screen.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <DashboardNavBar />
      <main>{children}</main>
    </div>
  );
}
