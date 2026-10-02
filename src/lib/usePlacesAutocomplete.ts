"use client";

import { RefObject, useEffect, useRef } from "react";
import { isGoogleMapsConfigured, loadGoogleMaps, parsePlaceAddress, type ParsedAddress } from "@/lib/googleMaps";

/**
 * Attaches Google Places Autocomplete to an <input>. When the user picks a
 * suggestion, `onPick` receives the parsed address fields. No-op (plain input)
 * when the Maps key isn't configured or the API fails to load.
 */
export function usePlacesAutocomplete(
  inputRef: RefObject<HTMLInputElement | null>,
  onPick: (address: ParsedAddress) => void,
): void {
  const onPickRef = useRef(onPick);
  useEffect(() => {
    onPickRef.current = onPick;
  });

  useEffect(() => {
    if (!isGoogleMapsConfigured() || !inputRef.current) {
      return;
    }

    let listener: google.maps.MapsEventListener | null = null;
    let cancelled = false;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !inputRef.current) return;
        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ["address_components", "name"],
          types: ["address"],
        });
        listener = autocomplete.addListener("place_changed", () => {
          const parsed = parsePlaceAddress(autocomplete.getPlace());
          if (parsed.line1) onPickRef.current(parsed);
        });
      })
      .catch(() => {
        // No key / load failure — the plain input keeps working.
      });

    return () => {
      cancelled = true;
      listener?.remove();
    };
  }, [inputRef]);
}
