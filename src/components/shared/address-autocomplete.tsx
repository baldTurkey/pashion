"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { fetchAddressSuggestions, isMapboxConfigured, type AddressSuggestion } from "@/lib/mapbox/geocode";
import "./address-autocomplete.css";

interface AddressAutocompleteProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: AddressSuggestion) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

// Debounced Mapbox-backed address search. Degrades to a plain text input
// (no dropdown) when NEXT_PUBLIC_MAPBOX_TOKEN isn't set, so every field this
// powers keeps working even before that env var is configured.
export function AddressAutocomplete({
  id,
  name,
  value,
  onChange,
  onSelect,
  onBlur,
  placeholder,
  className,
  required,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownRect, setDropdownRect] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Dropdown is rendered in a portal at document.body and positioned with
  // `fixed` coords from the input's own rect — any ancestor form field with
  // `isolation: isolate` (e.g. the signup forms) otherwise traps a nested
  // z-index inside its own stacking context, so the list would render behind
  // later sibling fields no matter how high the z-index was set.
  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = inputRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  const handleChange = (next: string) => {
    onChange(next);

    if (!isMapboxConfigured()) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (next.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await fetchAddressSuggestions(next);
        if (requestId !== requestIdRef.current) return; // a newer keystroke's request already won
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        if (requestId === requestIdRef.current) setSuggestions([]);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, 300);
  };

  const handleSelect = (suggestion: AddressSuggestion) => {
    onChange(suggestion.placeName);
    onSelect?.(suggestion);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div className="address-autocomplete" ref={containerRef}>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        required={required}
        className={className}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={onBlur}
      />
      {loading && <span className="address-autocomplete-loading">Searching…</span>}
      {open &&
        suggestions.length > 0 &&
        createPortal(
          <ul
            className="address-autocomplete-list"
            style={{ position: "fixed", top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width }}
          >
            {suggestions.map((suggestion) => (
              <li key={suggestion.id}>
                <button
                  type="button"
                  className="address-autocomplete-option"
                  // onMouseDown (not onClick) fires before the input's onBlur/click-outside handler closes the list
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(suggestion);
                  }}
                >
                  {suggestion.placeName}
                </button>
              </li>
            ))}
          </ul>,
          document.body
        )}
    </div>
  );
}

