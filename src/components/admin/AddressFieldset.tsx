"use client";

import { useEffect, useRef } from "react";
import { countryCode } from "@/lib/countries";
import { isGoogleMapsConfigured } from "@/lib/googleMaps";
import { usePlacesAutocomplete } from "@/lib/usePlacesAutocomplete";

export type AddressForm = {
  label: string;
  contact_name: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

export const EMPTY_ADDRESS: AddressForm = {
  label: "",
  contact_name: "",
  phone: "",
  email: "",
  line1: "",
  line2: "",
  postal_code: "",
  city: "",
  state: "",
  country: "Nigeria",
};

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

  // Keep the latest value available to the (stable) onPick callback so a picked
  // address merges against current state instead of a stale snapshot.
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  });

  usePlacesAutocomplete(
    line1Ref,
    (parsed) => {
      const next: AddressForm = { ...valueRef.current, line1: parsed.line1 };
      if (parsed.city) next.city = parsed.city;
      if (parsed.state) next.state = parsed.state;
      if (parsed.postal_code) next.postal_code = parsed.postal_code;
      if (parsed.country) next.country = parsed.country;
      onChange(next);
    },
    { country: countryCode(value.country) },
  );

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
        <label className="block text-sm font-semibold text-navy">Email (optional)</label>
        <input type="email" value={value.email} onChange={update("email")} className={inputClass} />
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
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-navy">City</label>
          <input required value={value.city} onChange={update("city")} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-navy">State</label>
          <input required value={value.state} onChange={update("state")} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-navy">Postal code (optional)</label>
          <input value={value.postal_code} onChange={update("postal_code")} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-navy">Country</label>
          <input required value={value.country} onChange={update("country")} className={inputClass} />
        </div>
      </div>
    </div>
  );
}
