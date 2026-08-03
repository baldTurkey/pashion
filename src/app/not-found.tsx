import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-brand-cream px-4 text-center">
      <h1 className="font-serif text-4xl text-brand-ink">Page not found</h1>
      <p className="text-brand-ink/70">We couldn&apos;t find what you were looking for.</p>
      <Link href="/" className="rounded-full bg-brand-accent px-6 py-2.5 text-white hover:bg-brand-olive-dark">
        Go home
      </Link>
    </div>
  );
}