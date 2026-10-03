// Free, keyless address autocomplete via Photon (https://photon.komoot.io),
// an OpenStreetMap-based geocoder. No API key, account, or billing required —
// chosen over Google Places so autocomplete works without a billing-enabled
// Google Cloud project. CORS-enabled, so it's called directly from the browser.

const PHOTON_URL = "https://photon.komoot.io/api/";

export type ParsedAddress = {
  line1: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
};

export type AddressSuggestion = {
  /** Primary line shown in the dropdown (and dropped into the line-1 field). */
  label: string;
  /** Muted second line (city, state, country). */
  secondary?: string;
  address: ParsedAddress;
};

type PhotonProperties = {
  name?: string;
  housenumber?: string;
  street?: string;
  city?: string;
  locality?: string;
  district?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
  countrycode?: string;
  type?: string;
};

type PhotonResponse = {
  features?: Array<{ properties?: PhotonProperties }>;
};

/** Autocomplete is always available (the provider needs no configuration). */
export function isAddressAutocompleteEnabled(): boolean {
  return true;
}

function dedupeJoin(parts: Array<string | undefined>): string {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const part of parts) {
    const value = part?.trim();
    if (!value || seen.has(value.toLowerCase())) continue;
    seen.add(value.toLowerCase());
    kept.push(value);
  }
  return kept.join(", ");
}

/**
 * Fetch address suggestions for `query`. Pass `country` (ISO 3166-1 alpha-2,
 * e.g. "NG") to keep only results from that country. Resolves to [] on any
 * failure so the caller can simply fall back to manual entry.
 */
export async function fetchAddressSuggestions(
  query: string,
  opts: { country?: string | null; signal?: AbortSignal } = {},
): Promise<AddressSuggestion[]> {
  const url = new URL(PHOTON_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "8");
  url.searchParams.set("lang", "en");

  let data: PhotonResponse;
  try {
    const res = await fetch(url.toString(), { signal: opts.signal });
    if (!res.ok) return [];
    data = (await res.json()) as PhotonResponse;
  } catch {
    return [];
  }

  const wantedCountry = opts.country?.toUpperCase() || null;
  const seen = new Set<string>();
  const suggestions: AddressSuggestion[] = [];

  for (const feature of data.features ?? []) {
    const p = feature.properties ?? {};
    if (wantedCountry && p.countrycode && p.countrycode.toUpperCase() !== wantedCountry) {
      continue;
    }

    const street = [p.housenumber, p.street].filter(Boolean).join(" ");
    const line1 = street || p.name || "";
    if (!line1) continue;

    const city = p.city || p.locality || p.district || p.county || "";

    const address: ParsedAddress = { line1 };
    if (city) address.city = city;
    if (p.state) address.state = p.state;
    if (p.postcode) address.postal_code = p.postcode;
    if (p.country) address.country = p.country;

    const label = p.name && p.name !== line1 ? p.name : line1;
    const secondary = dedupeJoin([
      p.name && p.name !== line1 ? line1 : undefined,
      city,
      p.state,
      p.country,
    ]);

    const key = `${label}|${secondary}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    suggestions.push({ label, secondary: secondary || undefined, address });
  }

  return suggestions;
}
