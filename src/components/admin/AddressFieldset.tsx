"use client";

import { useEffect, useRef } from "react";
import { countryCode } from "@/lib/countries";
import { isGoogleMapsConfigured, loadGoogleMaps } from "@/lib/googleMaps";

export type AddressForm = {
  label: string;
  contact_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
};

export const EMPTY_ADDRESS: AddressForm = {
  label: "",
  contact_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  country: "Nigeria",
};

function componentValue(
  components: google.maps.GeocoderAddressComponent[],
  type: string,
): string {
  return components.find((c) => c.types.includes(type))?.long_name ?? "";
}

function parsePlace(place: google.maps.places.PlaceResult): Partial<AddressForm> {
  const components = place.address_components ?? [];

  const streetNumber = componentValue(components, "street_number");
  const route = componentValue(components, "route");
  const line1 = [streetNumber, route].filter(Boolean).join(" ") || place.name || "";

  const city =
    componentValue(components, "locality") ||
    componentValue(components, "postal_town") ||
    componentValue(components, "administrative_area_level_2");

  const state = componentValue(components, "administrative_area_level_1");
  const country = componentValue(components, "country");

  const parsed: Partial<AddressForm> = { line1 };
  if (city) parsed.city = city;
  if (state) parsed.state = state;
  if (country) parsed.country = country;

  return parsed;
}

export function AddressFieldset({
  title,
  value,
  onChange,
}: {
  title: string;
  value: AddressForm;
  onChange: (next: AddressForm) => void;
}) {
  const line1Ref = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Keep the latest value/onChange available to the place_changed listener,
  // which is registered once but must always merge against current state.
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!isGoogleMapsConfigured() || !line1Ref.current) {
      return;
    }

    let listener: google.maps.MapsEventListener | null = null;
    let cancelled = false;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !line1Ref.current) {
          return;
        }

        const initialCountry = countryCode(valueRef.current.country);

        const autocomplete = new google.maps.places.Autocomplete(line1Ref.current, {
          fields: ["address_components", "name"],
          types: ["address"],
          componentRestrictions: initialCountry ? { country: initialCountry } : undefined,
        });

        autocompleteRef.current = autocomplete;

        listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const parsed = parsePlace(place);

          if (!parsed.line1) {
            return;
          }

          onChangeRef.current({ ...valueRef.current, ...parsed });
        });
      })
      .catch(() => {
        // No key or load failure — the plain input keeps working.
      });

    return () => {
      cancelled = true;
      if (listener) {
        listener.remove();
      }
      autocompleteRef.current = null;
    };
  }, []);

  // Re-restrict suggestions whenever the selected country changes.
  const restrictionCode = countryCode(value.country);
  useEffect(() => {
    if (autocompleteRef.current) {
      autocompleteRef.current.setComponentRestrictions(
        restrictionCode ? { country: restrictionCode } : null,
      );
    }
  }, [restrictionCode]);

  function update(field: keyof AddressForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [field]: e.target.value });
  }

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy";

  return (
    <div className="rounded-2xl border border-black/5 p-6">
      <p className="text-sm font-semibold text-navy">{title}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-navy">Contact name</label>
          <input required value={value.contact_name} onChange={update("contact_name")} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-navy">Phone</label>
          <input required value={value.phone} onChange={update("phone")} className={inputClass} />
        </div>
      </div>
      <div className="mt-4">
        <label className="block text-sm font-semibold text-navy">Address line 1</label>
        <input
          ref={line1Ref}
          required
          value={value.line1}
          onChange={update("line1")}
          autoComplete="off"
          placeholder={isGoogleMapsConfigured() ? "Start typing an address…" : undefined}
          className={inputClass}
        />
      </div>
      <div className="mt-4">
        <label className="block text-sm font-semibold text-navy">Address line 2 (optional)</label>
        <input value={value.line2} onChange={update("line2")} className={inputClass} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-semibold text-navy">City</label>
          <input required value={value.city} onChange={update("city")} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-navy">State</label>
          <input required value={value.state} onChange={update("state")} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-navy">Country</label>
          <input required value={value.country} onChange={update("country")} className={inputClass} />
        </div>
      </div>
    </div>
  );
}
