"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";

type InventoryRow = {
	id: number;
	brand_id: string | null;
	created_at: string;
	name: string | null;
	currentPrice: string | null;
	type: string | null;
	description: string | null;
	size: string[];
	style: string | null;
	stock: number;
	supply: string[] | null;
	shipping_status: string | null;
	ready_to_sell_date: string | null;
};

type InventoryDbRow = {
	id: number | string | null;
	brand_id?: string | null;
	created_at: string | null;
	name: string | null;
	currentPrice?: string | null;
	current_price?: string | null;
	type: string | null;
	description?: string | null;
	size?: string[] | string | null;
	style?: string | null;
	stock: number | string | null;
	supply?: string[] | null;
	shipping_status: string | null;
	ready_to_sell_date?: string | null;
};

type InventoryEditValue = {
	id: number;
	name: string;
	currentPrice: string;
	type: string;
	stock: string;
	shipping_status: string;
	ready_to_sell_date: string;
};

function getSupplyTotal(supply: string[] | null | undefined, stock: number) {
	const firstValue = supply?.[0];
	const parsedTotal = Number(firstValue);

	if (Number.isFinite(parsedTotal) && parsedTotal >= 0) {
		return parsedTotal;
	}

	return stock;
}

function formatDate(value: string | null) {
	if (!value) {
		return "-";
	}

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

function formatDateTime(value: string | null) {
	if (!value) {
		return "-";
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "-";
	}

	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "2-digit",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(date);
}

function toInputDate(value: string | null) {
	if (!value) {
		return "";
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "";
	}

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

function toSizeList(size: string[] | string | null | undefined) {
	if (Array.isArray(size)) {
		return size.map((entry) => entry.trim()).filter(Boolean);
	}

	if (typeof size === "string") {
		const trimmed = size.trim();
		if (!trimmed) {
			return [];
		}

		try {
			const parsed = JSON.parse(trimmed);
			if (Array.isArray(parsed)) {
				return parsed.map((entry) => String(entry).trim()).filter(Boolean);
			}
		} catch {
			// Fall back to comma-delimited values when size is not JSON.
		}

		return trimmed
			.split(",")
			.map((entry) => entry.trim())
			.filter(Boolean);
	}

	return [];
}

function mapInventoryRow(row: InventoryDbRow): InventoryRow {
	const stockNumber = Number(row.stock ?? 0);

	return {
		id: Number(row.id ?? 0),
		brand_id: row.brand_id ?? null,
		created_at: row.created_at ?? "",
		name: row.name,
		currentPrice: row.currentPrice ?? row.current_price ?? null,
		type: row.type,
		description: row.description ?? null,
		size: toSizeList(row.size),
		style: row.style ?? null,
		stock: getSupplyTotal(row.supply, Number.isFinite(stockNumber) ? stockNumber : 0),
		supply: row.supply ?? null,
		shipping_status: row.shipping_status,
		ready_to_sell_date: row.ready_to_sell_date ?? null,
	};
}

export default function InventoryPage() {
	const router = useRouter();
	const [inventory, setInventory] = useState<InventoryRow[]>([]);
	const [brandName, setBrandName] = useState("your brand");
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [formValues, setFormValues] = useState<Record<number, InventoryEditValue>>({});
	const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

	useEffect(() => {
		let isActive = true;

		const loadInventory = async () => {
			const supabase = createClient();
			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser();

			if (!isActive) {
				return;
			}

			if (userError || !user) {
				router.replace("/sign-up/brand");
				return;
			}

			const { data: brand, error: brandError } = await supabase
				.from("brands")
				.select("brand_uuid, company_name")
				.eq("account_id", user.id)
				.maybeSingle();

			if (!isActive) {
				return;
			}

			if (brandError || !brand?.brand_uuid) {
				router.replace("/sign-up/brand");
				return;
			}

			setBrandName(brand.company_name ?? "your brand");

			const { data, error: inventoryError } = await supabase
				.from("inventory")
				.select("*")
				.eq("brand_id", brand.brand_uuid)
				.order("created_at", { ascending: false });

			if (!isActive) {
				return;
			}

			if (inventoryError) {
				setError(inventoryError.message);
				setLoading(false);
				return;
			}

			const nextInventory = ((data ?? []) as InventoryDbRow[]).map(mapInventoryRow);
			setInventory(nextInventory);
			setFormValues(
				Object.fromEntries(
					nextInventory.map((item) => [
						item.id,
						{
							id: item.id,
							name: item.name ?? "",
							currentPrice: item.currentPrice ?? "",
							type: item.type ?? "",
							stock: String(item.stock ?? 0),
							shipping_status: item.shipping_status ?? "Pending",
							ready_to_sell_date: toInputDate(item.ready_to_sell_date),
						},
					]),
				),
			);
			setError(null);
			setLoading(false);
		};

		loadInventory();

		return () => {
			isActive = false;
		};
	}, [router]);

	const startEditing = () => {
		setError(null);
		setIsEditing(true);
		setFormValues(
			Object.fromEntries(
				inventory.map((item) => [
					item.id,
					{
						id: item.id,
						name: item.name ?? "",
						currentPrice: item.currentPrice ?? "",
						type: item.type ?? "",
						stock: String(item.stock ?? 0),
						shipping_status: item.shipping_status ?? "Pending",
						ready_to_sell_date: toInputDate(item.ready_to_sell_date),
					},
				]),
			),
		);
	};

	const cancelEditing = () => {
		setIsEditing(false);
		setError(null);
	};

	const updateField = (itemId: number, field: keyof InventoryEditValue, value: string) => {
		setFormValues((current) => ({
			...current,
			[itemId]: {
				...(current[itemId] ?? { id: itemId, name: "", currentPrice: "", type: "", stock: "0", shipping_status: "Pending", ready_to_sell_date: "" }),
				[field]: value,
			},
		}));
	};

	const toggleRowExpanded = (itemId: number) => {
		setExpandedRows((current) => ({
			...current,
			[itemId]: !current[itemId],
		}));
	};

	const handleSubmit = async () => {
		setIsSaving(true);
		setError(null);

		try {
			const supabase = createClient();
			await Promise.all(
				inventory.map(async (item) => {
					const values = formValues[item.id];
					if (!values) {
						return;
					}

					const stockValue = Number(values.stock);
					const payload = {
						name: values.name.trim() || null,
						currentPrice: values.currentPrice.trim() || null,
						type: values.type.trim() || null,
						stock: Number.isFinite(stockValue) ? stockValue : 0,
						supply: [String(Number.isFinite(stockValue) ? stockValue : 0)],
						shipping_status: values.shipping_status || "Pending",
						ready_to_sell_date: values.ready_to_sell_date || null,
					};

					const { error: updateError } = await supabase.from("inventory").update(payload).eq("id", item.id);

					if (updateError) {
						throw updateError;
					}
				}),
			);

			const nextInventory = inventory.map((item) => {
				const values = formValues[item.id];
				if (!values) {
					return item;
				}

				const stockValue = Number(values.stock);
				return {
					...item,
					name: values.name.trim() || null,
					currentPrice: values.currentPrice.trim() || null,
					type: values.type.trim() || null,
					stock: Number.isFinite(stockValue) ? stockValue : 0,
					supply: [String(Number.isFinite(stockValue) ? stockValue : 0)],
					shipping_status: values.shipping_status || "Pending",
					ready_to_sell_date: values.ready_to_sell_date || null,
				};
			});

			setInventory(nextInventory);
			setIsEditing(false);
		} catch (updateError) {
			console.error("Failed to update inventory", updateError);
			setError(updateError instanceof Error ? updateError.message : "Could not update inventory right now.");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
				<div>
					<p className="text-xs uppercase tracking-[0.2em] text-brand-ink/60">Inventory</p>
					<h1 className="mt-1 font-serif text-3xl text-brand-ink">Inventory Management</h1>
					<p className="mt-2 text-sm text-brand-ink/60">Viewing items for {brandName}.</p>
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
						href="/brands/inventory/drafts"
						className="inline-flex items-center rounded-full border border-brand-ink/15 bg-white px-4 py-2 text-sm font-semibold text-brand-ink transition hover:bg-brand-blush"
					>
						Drafts
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
					<div className="flex flex-wrap items-center gap-2">
						{isEditing ? (
							<>
								<button
									type="button"
									onClick={handleSubmit}
									disabled={isSaving}
									className="inline-flex items-center rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-olive-dark disabled:cursor-not-allowed disabled:opacity-70"
								>
									{isSaving ? "Saving..." : "Submit"}
								</button>
								<button
									type="button"
									onClick={cancelEditing}
									className="inline-flex items-center rounded-full border border-brand-ink/15 bg-white px-4 py-2 text-sm font-semibold text-brand-ink transition hover:bg-brand-blush"
								>
									Cancel
								</button>
							</>
						) : (
							<button
								type="button"
								onClick={startEditing}
								className="inline-flex items-center rounded-full border border-brand-ink/15 bg-white px-4 py-2 text-sm font-semibold text-brand-ink transition hover:bg-brand-blush"
							>
								Update
							</button>
						)}
						<Link
							href="/brands/inventory/add"
							className="inline-flex items-center gap-2 rounded-full bg-brand-olive px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-olive-dark"
						>
							<span className="text-base leading-none">+</span>
							<span>Add to inventory</span>
						</Link>
					</div>
				</div>

				{error ? (
					<div className="px-4 py-8 text-sm text-red-700 sm:px-6">
						<p>Could not load inventory right now.</p>
						<p className="mt-1 text-xs text-red-900/80">{error}</p>
					</div>
				) : loading ? (
					<div className="px-4 py-12 text-center sm:px-6">
						<p className="font-serif text-xl text-brand-ink">Loading inventory...</p>
					</div>
				) : inventory.length === 0 ? (
					<div className="px-4 py-12 text-center sm:px-6">
						<p className="font-serif text-xl text-brand-ink">No inventory items yet</p>
						<p className="mt-2 text-sm text-brand-ink/70">Start by adding your first product to inventory.</p>
						<p className="mt-1 text-xs text-brand-ink/60">
							If you already have rows, check your Supabase RLS SELECT policy for the inventory table.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-brand-ink/10 text-sm">
							<thead className="bg-white">
								<tr>
									<th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-brand-ink sm:px-6">Details</th>
									<th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-brand-ink sm:px-6">Product Name</th>
									<th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-brand-ink">Ready to Sell Date</th>
									<th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-brand-ink">Current Price</th>
									<th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-brand-ink">Amount</th>
									<th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-brand-ink">Type</th>
									<th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-brand-ink">Stock</th>
									<th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-brand-ink sm:px-6">Delivery Status</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-brand-ink/10 bg-white/80">
								{inventory.map((item) => {
									const isOutOfStock = item.stock <= 0;
									const values = formValues[item.id];
									const isExpanded = !!expandedRows[item.id];

									return (
										<>
											<tr key={item.id} className={isEditing ? "border-l-2 border-r-2 border-brand-olive/70 bg-brand-cream/25" : undefined}>
												<td className="px-4 py-3 sm:px-6">
													<button
														type="button"
														onClick={() => toggleRowExpanded(item.id)}
														className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-brand-ink/15 bg-white text-sm font-semibold text-brand-ink transition hover:bg-brand-blush"
														aria-label={isExpanded ? "Collapse row details" : "Expand row details"}
														aria-expanded={isExpanded}
													>
														<span className={`transition-transform ${isExpanded ? "rotate-180" : "rotate-0"}`}>↓</span>
													</button>
												</td>
												<td className="px-4 py-3 text-brand-ink sm:px-6">
													{isEditing && values ? (
														<input
															type="text"
															value={values.name}
															onChange={(event) => updateField(item.id, "name", event.target.value)}
															className="w-full rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm text-brand-ink focus:border-brand-olive focus:outline-none"
														/>
													) : (
														item.name?.trim() || "Untitled Item"
													)}
												</td>
												<td className="px-4 py-3 text-brand-ink/80">
													{isEditing && values ? (
														<input
															type="date"
															value={values.ready_to_sell_date}
															onChange={(event) => updateField(item.id, "ready_to_sell_date", event.target.value)}
															className="w-full rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm text-brand-ink focus:border-brand-olive focus:outline-none"
														/>
													) : (
														formatDate(item.ready_to_sell_date)
													)}
												</td>
												<td className="px-4 py-3 text-brand-ink/80">
													{isEditing && values ? (
														<input
															type="text"
															value={values.currentPrice}
															onChange={(event) => updateField(item.id, "currentPrice", event.target.value)}
															className="w-full rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm text-brand-ink focus:border-brand-olive focus:outline-none"
														/>
													) : (
														item.currentPrice?.trim() || "-"
													)}
												</td>
												<td className="px-4 py-3 text-brand-ink/80">
													{isEditing && values ? (
														<input
															type="number"
															min="0"
															value={values.stock}
															onChange={(event) => updateField(item.id, "stock", event.target.value)}
															className="w-full rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm text-brand-ink focus:border-brand-olive focus:outline-none"
														/>
													) : (
														item.stock
													)}
												</td>
												<td className="px-4 py-3 text-brand-ink/80">
													{isEditing && values ? (
														<input
															type="text"
															value={values.type}
															onChange={(event) => updateField(item.id, "type", event.target.value)}
															className="w-full rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm text-brand-ink focus:border-brand-olive focus:outline-none"
														/>
													) : (
														item.type?.trim() || "-"
													)}
												</td>
												<td className="px-4 py-3">
													{isOutOfStock ? (
														<span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">OUT OF STOCK</span>
													) : (
														<span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">IN STOCK</span>
													)}
												</td>
												<td className="px-4 py-3 text-brand-ink/80 sm:px-6">
													{isEditing && values ? (
														<select
															value={values.shipping_status}
															onChange={(event) => updateField(item.id, "shipping_status", event.target.value)}
															className="w-full rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm text-brand-ink focus:border-brand-olive focus:outline-none"
														>
															<option value="Pending">Pending</option>
															<option value="Order Placed">Order Placed</option>
															<option value="In Transit">In Transit</option>
															<option value="Out for Delivery">Out for Delivery</option>
															<option value="Delivered">Delivered</option>
														</select>
													) : (
														item.shipping_status?.trim() || "Pending"
													)}
												</td>
											</tr>

											{isExpanded ? (
												<tr className="bg-brand-cream/20">
													<td colSpan={8} className="px-4 pb-4 pt-1 sm:px-6">
														<div className="rounded-xl border border-brand-ink/10 bg-white/80 p-4">
															<div className="grid gap-3 text-sm text-brand-ink/80 sm:grid-cols-2 lg:grid-cols-3">
																<p>
																	<span className="font-semibold text-brand-ink">Brand ID:</span> {item.brand_id?.trim() || "-"}
																</p>
																<p>
																	<span className="font-semibold text-brand-ink">Created At:</span> {formatDateTime(item.created_at)}
																</p>
																<p>
																	<span className="font-semibold text-brand-ink">Style:</span> {item.style?.trim() || "-"}
																</p>
															</div>

															<div className="mt-3">
																<p className="text-xs font-semibold uppercase tracking-wide text-brand-ink/70">Description</p>
																<p className="mt-1 text-sm text-brand-ink/80">{item.description?.trim() || "-"}</p>
															</div>

															<div className="mt-3">
																<p className="text-xs font-semibold uppercase tracking-wide text-brand-ink/70">Available Sizes</p>
																{item.size.length > 0 ? (
																	<div className="mt-1 flex flex-wrap gap-2">
																		{item.size.map((sizeValue) => (
																			<span
																				key={`${item.id}-${sizeValue}`}
																				className="inline-flex rounded-full bg-brand-blush px-2.5 py-1 text-xs font-semibold text-brand-ink"
																			>
																				{sizeValue}
																			</span>
																		))}
																	</div>
																) : (
																	<p className="mt-1 text-sm text-brand-ink/80">-</p>
																)}
															</div>
														</div>
													</td>
												</tr>
											) : null}
										</>
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
