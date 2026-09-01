"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import "./brandview.css";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard/brand" },
  { label: "Inventory", href: "/dashboard/brand/inventory" },
  { label: "My listings", href: "/dashboard/brand/listings" },
  { label: "Shows", href: "/dashboard/brand/shows" },
  { label: "Orders", href: "/dashboard/brand/orders" },
  { label: "Profile", href: "/dashboard/brand/profile" },
];



export default function BrandShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  //close menu when navigating
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // close menu esc
  /*
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  //prevent body scroll when menu open
   useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);
*/

  return (
    <div className="bv-root">

      {/* mobile menu btn */}
      <button
        className="bv-menu-toggle"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={isMenuOpen}
      >
        {isMenuOpen ? "✕" : "☰"}
      </button>

      {/* Overlayyyy */}
      {isMenuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(66,43,35,0.3)",
            zIndex: 999,
          }}
          onClick={() => setIsMenuOpen(false)}
        />
      )}

<aside className={`bv-sidebar ${isMenuOpen ? "open" : ""}`}>
        <div className="bv-brand-row">
          <div className="bv-brand-icon">B</div>
          <div className="bv-brand-name">Brand name</div>
        </div>

        <nav>
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/dashboard/brand"
                ? pathname === "/dashboard/brand"
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

    {/*
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
      </aside> */}
    </div>
  );
}