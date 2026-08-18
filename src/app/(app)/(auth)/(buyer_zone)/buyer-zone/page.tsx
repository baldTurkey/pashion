import Link from "next/link";

export default function BuyerZoneHomePage() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold">Buyer Zone</h2>
      <p className="mt-2 text-slate-600">Choose where you want to go.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/buy_here" className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
          Buy Here
        </Link>
        <Link href="/location" className="rounded-lg border border-slate-300 px-4 py-2 text-slate-900 hover:bg-slate-100">
          Location
        </Link>
        <Link href="/my_order" className="rounded-lg border border-slate-300 px-4 py-2 text-slate-900 hover:bg-slate-100">
          My Orders
        </Link>
        <Link href="/thanks_buying" className="rounded-lg border border-slate-300 px-4 py-2 text-slate-900 hover:bg-slate-100">
          Thanks Screen
        </Link>
      </div>
    </div>
  );
}
