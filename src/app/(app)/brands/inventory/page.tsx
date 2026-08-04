import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

type InventoryRow = {
	id: number;
	created_at: string;
	name: string | null;
	currentPrice: string | null;
	type: string | null;
	stock: number;
	shipping_status: string | null;
};

type InventoryDbRow = {
	id: number | string | null;
	created_at: string | null;
	name: string | null;
	currentPrice?: string | null;
	current_price?: string | null;
	type: string | null;
	stock: number | string | null;
	shipping_status: string | null;
};

function formatAddedDate(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "-";
	}

	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "2-digit",
		year: "numeric",
	}).format(date);
}

export default async function InventoryPage() {
	const supabase = await createSupabaseServer();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/sign-up/brand");
	}

	const { data: brand, error: brandError } = await supabase
		.from("brands")
		.select("brand_uuid, company_name")
		.eq("account_id", user.id)
		.maybeSingle();

	if (brandError) {
		return (
			<div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
				<Card className="p-8 text-center">
					<h1 className="font-serif text-2xl text-brand-ink">Could not load your brand</h1>
					<p className="mt-2 text-sm text-brand-ink/70">{brandError.message}</p>
				</Card>
			</div>
		);
	}

	if (!brand?.brand_uuid) {
		return (
			<div className="mx-auto w-full max-w-xl px-4 py-16 text-center">
				<Card className="p-8">
					<h1 className="font-serif text-2xl text-brand-ink">Finish your profile</h1>
					<p className="mt-2 text-brand-ink/70">
						We couldn&apos;t find a brand profile for this account yet.
					</p>
					<Link
						href="/sign-up/brand"
						className="mt-6 inline-flex rounded-full bg-brand-accent px-6 py-2.5 text-white hover:bg-brand-olive-dark"
					>
						Finish signing up
					</Link>
				</Card>
			</div>
		);
	}

	const { data, error } = await supabase
		.from("inventory")
		.select("*")
		.eq("brand_id", brand.brand_uuid)
		.order("created_at", { ascending: false });

	const inventory: InventoryRow[] = ((data ?? []) as InventoryDbRow[]).map((row) => {
		const stockNumber = Number(row.stock ?? 0);

		return {
			id: Number(row.id ?? 0),
			created_at: row.created_at ?? "",
			name: row.name,
			currentPrice: row.currentPrice ?? row.current_price ?? null,
			type: row.type,
			stock: Number.isFinite(stockNumber) ? stockNumber : 0,
			shipping_status: row.shipping_status,
		};
	});

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
				<div>
					<p className="text-xs uppercase tracking-[0.2em] text-brand-ink/60">Inventory</p>
					<h1 className="mt-1 font-serif text-3xl text-brand-ink">Inventory Management</h1>
					<p className="mt-2 text-sm text-brand-ink/60">Viewing items for {brand.company_name ?? "your brand"}.</p>
				</div>

				<div className="flex flex-wrap gap-2">
					<Link
						href="/brands/inventory/orders"
						className="inline-flex items-center rounded-full border border-brand-ink/15 bg-white px-4 py-2 text-sm font-semibold text-brand-ink transition hover:bg-brand-blush"
					>
						Orders
					</Link>
					<Link
						href="/brands/inventory/create-listing"
						className="inline-flex items-center rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-olive-dark"
					>
						Create Listing
					</Link>
					<Link
						href="/brands/inventory/my-listings"
						className="inline-flex items-center rounded-full border border-brand-ink/15 bg-brand-cream px-4 py-2 text-sm font-semibold text-brand-ink transition hover:bg-brand-blush"
					>
						View My Listings
					</Link>
				</div>
			</div>

			<Card className="overflow-hidden p-0">
				<div className="flex items-center justify-between border-b border-brand-ink/10 bg-brand-cream/60 px-4 py-3 sm:px-6">
					<h2 className="font-serif text-xl text-brand-ink">All Inventory Items</h2>
					<Link
						href="/brands/inventory/add"
						className="inline-flex items-center gap-2 rounded-full bg-brand-olive px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-olive-dark"
					>
						<span className="text-base leading-none">+</span>
						<span>Add to inventory</span>
					</Link>
				</div>

				{error ? (
					<div className="px-4 py-8 text-sm text-red-700 sm:px-6">
						<p>Could not load inventory right now.</p>
						<p className="mt-1 text-xs text-red-900/80">
							{error.message}
						</p>
					</div>
				) : inventory.length === 0 ? (
					<div className="px-4 py-12 text-center sm:px-6">
						<p className="font-serif text-xl text-brand-ink">No inventory items yet</p>
						<p className="mt-2 text-sm text-brand-ink/70">
							Start by adding your first product to inventory.
						</p>
						<p className="mt-1 text-xs text-brand-ink/60">
							If you already have rows, check your Supabase RLS SELECT policy for the inventory table.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-brand-ink/10 text-sm">
							<thead className="bg-white">
								<tr>
									<th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-brand-ink sm:px-6">
										Product Name
									</th>
									<th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-brand-ink">
										Added On
									</th>
									<th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-brand-ink">
										Current Price
									</th>
									<th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-brand-ink">
										Amount
									</th>
									<th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-brand-ink">Type</th>
									<th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-brand-ink">Stock</th>
									<th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-brand-ink sm:px-6">
										Delivery Status
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-brand-ink/10 bg-white/80">
								{inventory.map((item) => {
									const isOutOfStock = item.stock <= 0;

									return (
										<tr key={item.id}>
											<td className="whitespace-nowrap px-4 py-3 text-brand-ink sm:px-6">
												{item.name?.trim() || "Untitled Item"}
											</td>
											<td className="whitespace-nowrap px-4 py-3 text-brand-ink/80">
												{formatAddedDate(item.created_at)}
											</td>
											<td className="whitespace-nowrap px-4 py-3 text-brand-ink/80">
												{item.currentPrice?.trim() || "-"}
											</td>
											<td className="whitespace-nowrap px-4 py-3 text-brand-ink/80">{item.stock}</td>
											<td className="whitespace-nowrap px-4 py-3 text-brand-ink/80">
												{item.type?.trim() || "-"}
											</td>
											<td className="whitespace-nowrap px-4 py-3">
												{isOutOfStock ? (
													<span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
														OUT OF STOCK
													</span>
												) : (
													<span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
														IN STOCK
													</span>
												)}
											</td>
											<td className="whitespace-nowrap px-4 py-3 text-brand-ink/80 sm:px-6">
												{item.shipping_status?.trim() || "Pending"}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</Card>
		</div>
	);
}
