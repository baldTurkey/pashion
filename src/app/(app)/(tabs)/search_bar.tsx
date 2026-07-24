"use client";

import { useMemo, useState } from "react";

export type SearchableProduct = {
  id: string;
  name?: string | null;
  currentPrice?: number | null;
  current_price?: number | null;
  style?: string | null;
  color?: string | null;
  size?: string | null;
  sizes?: string[] | null;
  [key: string]: unknown;
};

type Props<T extends SearchableProduct> = {
  products: T[];
  onFilteredChange: (filtered: T[]) => void;
};

const ALL_SIZES = ["XS", "S", "M", "L", "XL"];

function getProductSizes(p: SearchableProduct): string[] {
  if (Array.isArray(p.sizes)) return p.sizes;
  if (typeof p.size === "string" && p.size.trim() !== "") return [p.size];
  return [];
}

export default function SearchBar<T extends SearchableProduct>({
  products,
  onFilteredChange,
}: Props<T>) {
  const [query, setQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const styles = useMemo(
    () => Array.from(new Set(products.map((p) => p.style).filter(Boolean))) as string[],
    [products]
  );
  const colors = useMemo(
    () => Array.from(new Set(products.map((p) => p.color).filter(Boolean))) as string[],
    [products]
  );

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const applyFilters = (
    q: string,
    price: number | "",
    sizes: string[],
    style: string,
    color: string
  ) => {
    const filtered = products.filter((p) => {
      const name = (p.name ?? "").toLowerCase();
      const matchesQuery = q.trim() === "" || name.includes(q.toLowerCase());
      const productPrice = Number(p.currentPrice ?? p.current_price ?? 0);
      const matchesPrice = price === "" || productPrice <= price;
      const productSizes = getProductSizes(p);
      const matchesSize = sizes.length === 0 || sizes.some((s) => productSizes.includes(s));
      const matchesStyle = style === "" || p.style === style;
      const matchesColor = color === "" || p.color === color;
      return matchesQuery && matchesPrice && matchesSize && matchesStyle && matchesColor;
    });
    onFilteredChange(filtered);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    applyFilters(value, maxPrice, selectedSizes, selectedStyle, selectedColor);
  };

  const handlePriceChange = (value: string) => {
    const parsed = value === "" ? "" : Number(value);
    setMaxPrice(parsed);
    applyFilters(query, parsed, selectedSizes, selectedStyle, selectedColor);
  };

  const handleSizeToggle = (size: string) => {
    toggleSize(size);
    const next = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];
    applyFilters(query, maxPrice, next, selectedStyle, selectedColor);
  };

  const handleStyleChange = (value: string) => {
    setSelectedStyle(value);
    applyFilters(query, maxPrice, selectedSizes, value, selectedColor);
  };

  const handleColorChange = (value: string) => {
    setSelectedColor(value);
    applyFilters(query, maxPrice, selectedSizes, selectedStyle, value);
  };

  const clearFilters = () => {
    setQuery("");
    setMaxPrice("");
    setSelectedSizes([]);
    setSelectedStyle("");
    setSelectedColor("");
    onFilteredChange(products);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search products by name..."
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Filters {showFilters ? "▲" : "▼"}
        </button>
      </div>

      {showFilters && (
        <div className="mt-4 grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Max price ($)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={maxPrice}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="Any"
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Style</label>
            <select
              value={selectedStyle}
              onChange={(e) => handleStyleChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
            >
              <option value="">All styles</option>
              {styles.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Color</label>
            <select
              value={selectedColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
            >
              <option value="">All colors</option>
              {colors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Sizes</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleSizeToggle(size)}
                  className={
                    selectedSizes.includes(size)
                      ? "rounded-md border border-slate-900 bg-slate-900 px-2 py-1 text-xs font-medium text-white"
                      : "rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700"
                  }
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end sm:col-span-2 lg:col-span-4">
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}