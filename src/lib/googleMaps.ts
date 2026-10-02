// Lightweight, lazy loader for the Google Maps JS API (Places library).
// The key is read from NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. When it is absent the
// address fields degrade gracefully to plain text inputs.

let loaderPromise: Promise<typeof google> | null = null;

export function googleMapsApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
}

export function isGoogleMapsConfigured(): boolean {
  return Boolean(googleMapsApiKey());
}

export type ParsedAddress = {
  line1: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
};

function component(components: google.maps.GeocoderAddressComponent[], type: string): string {
  return components.find((c) => c.types.includes(type))?.long_name ?? "";
}

/** Map a Google Places result onto our address-field shape. */
export function parsePlaceAddress(place: google.maps.places.PlaceResult): ParsedAddress {
  const components = place.address_components ?? [];
  const streetNumber = component(components, "street_number");
  const route = component(components, "route");
  const line1 = [streetNumber, route].filter(Boolean).join(" ") || place.name || "";

  const city =
    component(components, "locality") ||
    component(components, "postal_town") ||
    component(components, "administrative_area_level_2");

  const parsed: ParsedAddress = { line1 };
  if (city) parsed.city = city;
  const state = component(components, "administrative_area_level_1");
  if (state) parsed.state = state;
  const postal = component(components, "postal_code");
  if (postal) parsed.postal_code = postal;
  const country = component(components, "country");
  if (country) parsed.country = country;

  return parsed;
}

export function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser."));
  }

  const key = googleMapsApiKey();

  if (!key) {
    return Promise.reject(new Error("Google Maps API key is not configured."));
  }

  if (window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }

  if (loaderPromise) {
    return loaderPromise;
  }

  loaderPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("google-maps-js") as HTMLScriptElement | null;

    const onReady = () => {
      if (window.google?.maps?.places) {
        resolve(window.google);
      } else {
        reject(new Error("Google Maps loaded without the Places library."));
      }
    };

    if (existing) {
      existing.addEventListener("load", onReady);
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps.")));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-js";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", onReady);
    script.addEventListener("error", () => reject(new Error("Failed to load Google Maps.")));
    document.head.appendChild(script);
  });

  return loaderPromise;
}
