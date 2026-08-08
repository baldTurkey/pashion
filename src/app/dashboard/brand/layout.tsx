"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./brandview.css";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard/brand" },
  { label: "Inventory", href: "/dashboard/brand/inventory" },
  { label: "My listings", href: "/dashboard" },
  { label: "Shows", href: "/dashboard/shows" },
  { label: "Orders", href: "/dashboard/brand/orders" },
  { label: "Profile", href: "/dashboard/brand/profile" },
];

export default function BrandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="bv-root">
      <aside className="bv-sidebar">
        <div className="bv-brand-row">
          <div className="bv-brand-icon">B</div>
          <div className="bv-brand-name">Brand name</div>
        </div>

        <nav>
          {NAV_ITEMS.map((item) => {
            const isActive =
                item.href === "/dashboard/brand"
                ? pathname === "/dashboard/brand"
                : item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname?.startsWith(item.href);
                

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`bv-nav-link ${isActive ? "active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="bv-main">{children}</main>
    </div>
  );
}