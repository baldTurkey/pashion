import Link from "next/link";

export default function BrandDashboardPage() {
  return (
    <main
      className="min-h-screen px-6 py-10"
      style={{
        background: "linear-gradient(180deg, #ffd1e8 0%, #ffffff 72%)",
        fontFamily: '"Avenir Next", "Trebuchet MS", "Segoe UI", sans-serif',
      }}
    >
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-[#d8d1c3] bg-[#fffdf8] p-8 shadow-[0_20px_60px_rgba(37,42,33,0.14)]">
        <div className="mb-9 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6f6a5f]">Pashion Studio</p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight text-[#1f2a22] md:text-5xl">
              Build your next drop with intent.
            </h1>
            <p className="mt-3 text-[#54584f]">
              Host competitions, find new designs, and get your collection out there!
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/brand/dashboard/create-listing"
              className="inline-flex items-center rounded-full bg-[#194f3d] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(25,79,61,0.35)] transition hover:-translate-y-0.5 hover:bg-[#123c2f]"
            >
              Create Listing
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-[#c7beaf] bg-[#f6f1e6] px-5 py-3 text-sm font-medium text-[#2f372f] transition hover:bg-[#ede4d3]"
            >
              Back to home
            </Link>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-[#d9d1c4] bg-gradient-to-b from-[#fbf8ef] to-[#f2ecde] p-7">
            <h2 className="text-xl font-semibold text-[#1f2a22]">Current Collection</h2>
            <p className="mt-3 text-[#54584f]">
              lorum ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-[#cdc4b6] bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-[#7a7469]">Live Listings</p>
                <p className="mt-1 text-2xl font-semibold text-[#1d3026]">08</p>
              </div>
              <div className="rounded-2xl border border-[#cdc4b6] bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-[#7a7469]">Drafts</p>
                <p className="mt-1 text-2xl font-semibold text-[#1d3026]">03</p>
              </div>
              <div className="rounded-2xl border border-[#cdc4b6] bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-[#7a7469]">Sell-through</p>
                <p className="mt-1 text-2xl font-semibold text-[#1d3026]">71%</p>
              </div>
            </div>
          </section>

        
        </div>
      </div>
    </main>
  );
}
