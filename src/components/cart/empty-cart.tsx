import Link from "next/link";

export function EmptyCart() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-serif text-3xl text-brand-ink">Your bag is empty</h1>
      <p className="mt-2 text-brand-ink/70">
        Looks like you haven&apos;t added anything yet — browse our designers to find your next piece.
      </p>
      <Link
        href="/brands"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-accent px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-brand-olive-dark"
      >
        Browse Designers
      </Link>
    </div>
  );
}
