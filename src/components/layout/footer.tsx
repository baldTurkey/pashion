import Link from "next/link";
import { Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 bg-brand-olive px-6 py-10 text-white">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 sm:flex-row sm:justify-between">
        <div>
          <p className="font-serif text-lg font-semibold">Pashion</p>
          <p className="mt-2 max-w-xs text-sm text-white/70">
            Design. Vote. Create. Building brands with their community, before the first stitch.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white/70">Company</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <Link href="/" className="hover:text-brand-blush">About</Link>
            </li>
            <li>
              <Link href="/brands" className="hover:text-brand-blush">Designers</Link>
            </li>
            <li>
              <Link href="/" className="hover:text-brand-blush">Fashion Show</Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white/70">Contact Us</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <Mail size={14} />
              <span>hello@pashion.com</span>
            </li>
            <li>
              <Link href="/" className="hover:text-brand-blush">Instagram</Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
