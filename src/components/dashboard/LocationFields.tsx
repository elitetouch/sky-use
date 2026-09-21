"use client";

import { Country, State, City } from "country-state-city";

export type LocationValue = {
  countryCode: string;
  countryName: string;
  stateCode: string;
  stateName: string;
  city: string;
};

export const EMPTY_LOCATION: LocationValue = {
  countryCode: "",
  countryName: "",
  stateCode: "",
  stateName: "",
  city: "",
};

const selectClass =
  "w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy";

/** Cascading Country -> State -> City selects backed by the full dataset. */
export function LocationFields({
  value,
  onChange,
}: {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
}) {
  const countries = Country.getAllCountries();
  const states = value.countryCode ? State.getStatesOfCountry(value.countryCode) : [];
  const cities =
    value.countryCode && value.stateCode ? City.getCitiesOfState(value.countryCode, value.stateCode) : [];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <select
        value={value.countryCode}
        onChange={(e) => {
          const c = countries.find((x) => x.isoCode === e.target.value);
          onChange({ ...EMPTY_LOCATION, countryCode: c?.isoCode ?? "", countryName: c?.name ?? "" });
        }}
        className={selectClass}
      >
        <option value="">Country</option>
        {countries.map((c) => (
          <option key={c.isoCode} value={c.isoCode}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        value={value.stateCode}
        disabled={!value.countryCode}
        onChange={(e) => {
          const s = states.find((x) => x.isoCode === e.target.value);
          onChange({ ...value, stateCode: s?.isoCode ?? "", stateName: s?.name ?? "", city: "" });
        }}
        className={`${selectClass} disabled:opacity-50`}
      >
        <option value="">State</option>
        {states.map((s) => (
          <option key={s.isoCode} value={s.isoCode}>
            {s.name}
          </option>
        ))}
      </select>

      <select
        value={value.city}
        disabled={cities.length === 0}
        onChange={(e) => onChange({ ...value, city: e.target.value })}
        className={`${selectClass} disabled:opacity-50`}
      >
        <option value="">{cities.length === 0 ? "City (n/a)" : "City"}</option>
        {cities.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
