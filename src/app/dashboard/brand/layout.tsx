import Link from "next/link";
import { usePathname } from "next/navigation";
import "./brandview.css";
import BrandShell from "./BrandShell";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard/brand" },
  { label: "Inventory", href: "/dashboard/brand/inventory" },
  { label: "My listings", href: "/dashboard/brand/listings" },
  { label: "Shows", href: "/dashboard/brand/shows" },
  { label: "Orders", href: "/dashboard/brand/orders" },
  { label: "Profile", href: "/dashboard/brand/profile" },
];

export default function BrandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BrandShell>{children}</BrandShell>;
}