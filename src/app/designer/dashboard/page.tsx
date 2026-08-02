import Link from "next/link";

export default function DesignerDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-10">
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-700 bg-slate-900/90 p-8 shadow-xl shadow-slate-900/30">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Designer Dashboard</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">Welcome back, creator</h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
          >
            Back to home
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <section className="rounded-3xl border border-slate-700 bg-slate-950 p-6">
            <h2 className="text-xl font-semibold text-white">Designer tools</h2>
            <p className="mt-3 text-slate-400">
              This is your designer dashboard home. Add portfolio controls, order management, and collaboration tools here.
            </p>
          </section>

          <section className="rounded-3xl border border-slate-700 bg-slate-950 p-6">
            <h2 className="text-xl font-semibold text-white">Quick actions</h2>
            <ul className="mt-3 space-y-2 text-slate-400">
              <li>• Update your profile details</li>
              <li>• View incoming briefs</li>
              <li>• Track active fashion drops</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
