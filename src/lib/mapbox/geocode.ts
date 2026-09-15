// Thin wrapper around Mapbox's Geocoding API (v5) for forward address search.
// Needs NEXT_PUBLIC_MAPBOX_TOKEN set — see README/.env.local. Falls back to
// returning no suggestions (never throws for a missing token) so every
// address field this powers still works as a plain text input if unset.
export interface AddressSuggestion {
  id: string;
  placeName: string;
  address: string | null;
  city: string | null;
  region: string | null;
  postcode: string | null;
  country: string | null;
  countryCode: string | null;
  longitude: number | null;
  latitude: number | null;
}

interface MapboxContextEntry {
  id: string;
  text: string;
  short_code?: string;
}

interface MapboxFeature {
  id: string;
  place_name: string;
  text: string;
  address?: string;
  place_type?: string[];
  center?: [number, number];
  context?: MapboxContextEntry[];
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export function isMapboxConfigured(): boolean {
  return Boolean(MAPBOX_TOKEN);
}

function findContext(context: MapboxContextEntry[] | undefined, prefix: string) {
  return context?.find((entry) => entry.id.startsWith(prefix)) ?? null;
}

export async function fetchAddressSuggestions(
  query: string,
  signal?: AbortSignal
): Promise<AddressSuggestion[]> {
  if (!MAPBOX_TOKEN || query.trim().length < 3) {
    return [];
  }

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
  );
  url.searchParams.set("access_token", MAPBOX_TOKEN);
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("limit", "5");
  url.searchParams.set("types", "address,place,postcode,locality,neighborhood");

  const response = await fetch(url.toString(), { signal });

  if (!response.ok) {
    throw new Error("Failed to fetch address suggestions");
  }

  const data = (await response.json()) as { features?: MapboxFeature[] };
  const features = data.features ?? [];

  return features.map((feature) => {
    const isAddress = feature.place_type?.includes("address");
    const city = findContext(feature.context, "place") ?? findContext(feature.context, "locality");
    const region = findContext(feature.context, "region");
    const postcode = findContext(feature.context, "postcode");
    const country = findContext(feature.context, "country");

    return {
      id: feature.id,
      placeName: feature.place_name,
      address: isAddress ? [feature.address, feature.text].filter(Boolean).join(" ") : null,
      city: city?.text ?? null,
      region: region?.text ?? null,
      postcode: postcode?.text ?? null,
      country: country?.text ?? null,
      countryCode: country?.short_code?.toUpperCase() ?? null,
      longitude: feature.center?.[0] ?? null,
      latitude: feature.center?.[1] ?? null,
    };
  });
}
