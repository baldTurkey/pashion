import Link from "next/link";

export default function ShopPage() {
  return (
    <main className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Shop</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Open a product from the home page to view its full details.
        </p>
        <div className="mt-5">
          <Link
            href="/home"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}