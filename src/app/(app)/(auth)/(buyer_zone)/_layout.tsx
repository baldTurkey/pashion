import Link from "next/link";
import { ReactNode } from "react";

type BuyerZoneLayoutProps = {
  children?: ReactNode;
};

export default function Layout({ children }: BuyerZoneLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold">Buyer Zone</h1>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-slate-600 hover:text-slate-900">
              Home
            </Link>
            <Link href="/sign-up" className="text-slate-600 hover:text-slate-900">
              Sign up
            </Link>
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-4 py-6">{children ?? null}</section>
    </main>
  );
}
